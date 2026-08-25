import { readdir, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { parse } from "yaml";

export const root = new URL("../../", import.meta.url).pathname;
export const resumeRoot = join(root, "resume");
export const publicOutputDir = join(resumeRoot, "generated");
export const privateOutputDir = join(resumeRoot, "private-output");
export const resumeSource = join(resumeRoot, "resume.yaml");
export const privateSource = join(resumeRoot, "private.local.yaml");

const phonePattern = /^01[016789]-\d{3,4}-\d{4}$/;
const forbiddenGapPattern = /개인\s*사정|경력\s*휴식|2023\.09\s*[–~-]\s*2026\.03/;
const riskyClaimPattern = /대규모|무중단|고가용성|Exactly-once|자동\s*복구|완벽한|획기적/iu;

const loadYaml = async (path) => parse(await readFile(path, "utf8"));
const textOf = (value) => typeof value === "string" ? value : value?.text;

const normalizeLegacyResume = (source) => {
  if (source?.meta?.schemaVersion !== 1) return source;

  const university = source.education?.find((item) => item.label === "학력");
  const training = source.education
    ?.filter((item) => item.label !== "학력")
    .map(({ label: _label, ...item }) => item) ?? [];

  return {
    ...source,
    meta: {
      ...source.meta,
      schemaVersion: 2,
      normalizedFromSchemaVersion: 1,
    },
    candidate: {
      ...source.candidate,
      educationSummary: university ? {
        text: `${university.title} ${university.detail}`,
        refs: university.refs,
      } : null,
      summary: source.candidate?.summary?.map((text) => ({ text })) ?? [],
    },
    experiences: source.experiencePages?.flatMap((page) => page.entries).map((entry) => ({
      ...entry,
      context: { text: entry.context },
      contribution: { text: entry.contribution },
      highlights: entry.bullets,
    })) ?? [],
    selectedProjects: source.projects?.map((project) => ({
      ...project,
      highlights: project.sentences,
    })) ?? [],
    training,
  };
};

const buildEvidenceIndex = async () => {
  const directories = [
    join(root, "src", "data", "evidence"),
    join(resumeRoot, "evidence"),
  ];
  const index = new Map();

  for (const directory of directories) {
    const files = (await readdir(directory)).filter((name) => /\.ya?ml$/.test(name));
    for (const file of files) {
      const evidence = await loadYaml(join(directory, file));
      for (const fact of evidence.facts ?? []) {
        index.set(`${evidence.contentSlug}#fact:${fact.id}`, {
          kind: "fact",
          slug: evidence.contentSlug,
          ...fact,
        });
      }
      for (const metric of evidence.metrics ?? []) {
        index.set(`${evidence.contentSlug}#metric:${metric.id}`, {
          kind: "metric",
          slug: evidence.contentSlug,
          confidence: "confirmed",
          ...metric,
        });
      }
    }
  }

  return index;
};

const collectReferences = (value, references = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, references));
    return references;
  }
  if (!value || typeof value !== "object") return references;

  for (const [key, item] of Object.entries(value)) {
    if (key === "refs" && Array.isArray(item)) references.push(...item);
    else collectReferences(item, references);
  }
  return references;
};

const collectText = (value, text = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, text));
    return text;
  }
  if (!value || typeof value !== "object") return text;

  for (const [key, item] of Object.entries(value)) {
    if (key === "refs" || key === "url" || key === "path") continue;
    if (typeof item === "string") text.push(item);
    else collectText(item, text);
  }
  return text;
};

const assertResumeShape = (data) => {
  const failures = [];
  const assert = (condition, message) => { if (!condition) failures.push(message); };
  const isLegacy = data?.meta?.normalizedFromSchemaVersion === 1;

  assert(data?.meta?.schemaVersion === 2, "meta.schemaVersion must be 2");
  assert(!("expectedPages" in (data?.meta ?? {})), "meta.expectedPages must not constrain resume length");
  assert(data?.candidate?.experienceLabel === "백엔드 경력 3년 7개월", "experience label must be 3년 7개월");
  assert(Boolean(textOf(data?.candidate?.educationSummary)), "candidate.educationSummary is required");
  assert(isLegacy || Boolean(data?.photo?.path && data?.photo?.alt), "schema v2 requires a photo path and alt text");
  assert(!data?.education, "education must appear only in candidate.educationSummary");
  assert(data?.training?.length === 1, "training must contain the current AI program");
  assert(data?.certifications?.length === 2, "certifications must contain SQLD and PCCE");
  assert(!data?.careerSummary, "careerSummary duplicates detailed experience and must be omitted");
  assert(!data?.experiencePages, "experiencePages must be replaced by flowing experiences");
  assert(!data?.projects, "projects must be replaced by selectedProjects");

  const experiences = data?.experiences ?? [];
  assert(experiences.length === 4, "experiences must contain four employers");
  assert(new Set(experiences.map((entry) => entry.company)).size === 4, "experience employers must be unique");
  for (const entry of experiences) {
    const cases = entry.caseStudies ?? [];
    assert(cases.length <= 2, `${entry.company} must contain at most two representative cases`);
    if (entry.presentation === "compact") {
      assert(entry.company === "지투이", "only the oldest G2E experience may use compact presentation");
      assert((entry.highlights?.length ?? 0) <= 1, "compact G2E experience must contain at most one highlight");
      assert(cases.length === 0, "compact G2E experience must not contain detailed case studies");
    } else {
      assert(cases.length >= 1, `${entry.company} requires at least one representative case`);
      for (const study of cases) {
        assert(Boolean(study.title), `${entry.company} case study title is required`);
        assert(Boolean(textOf(study.problem)), `${entry.company}/${study.title}: problem is required`);
        assert(Boolean(textOf(study.decision)), `${entry.company}/${study.title}: decision is required`);
        assert(Boolean(textOf(study.verification)), `${entry.company}/${study.title}: verification is required`);
        assert(Boolean(textOf(study.limitation)), `${entry.company}/${study.title}: limitation is required`);
      }
    }
  }

  const projects = data?.selectedProjects ?? [];
  assert(projects.map((project) => project.title).join(",") === "KExcel,WorkShield", "selectedProjects must contain KExcel and WorkShield only");
  for (const project of projects) {
    assert(project.highlights?.length === 2, `${project.title} must remain limited to two highlights`);
  }

  const allText = collectText(data).join("\n");
  assert(!forbiddenGapPattern.test(allText), "career-gap wording must not appear in the resume source");
  assert(!riskyClaimPattern.test(allText), "resume source contains a high-risk claim expression");

  if (failures.length) throw new Error(`Resume source validation failed:\n- ${failures.join("\n- ")}`);
};

const assertEvidence = (data, evidenceIndex) => {
  const failures = [];
  const references = collectReferences(data);
  if (!references.length) failures.push("resume source does not contain evidence references");

  for (const reference of references) {
    const evidence = evidenceIndex.get(reference);
    if (!evidence) {
      failures.push(`${reference}: evidence does not exist`);
      continue;
    }
    if (!evidence.public) failures.push(`${reference}: evidence is not public`);
    if (evidence.confidence !== "confirmed") failures.push(`${reference}: evidence is not confirmed`);
  }

  if (failures.length) throw new Error(`Resume evidence validation failed:\n- ${failures.join("\n- ")}`);
};

const loadPhoto = async (data) => {
  if (!data.photo?.path) return null;

  const path = resolve(root, data.photo.path);
  if (!path.startsWith(root)) throw new Error("Resume photo must be inside the repository");
  const extension = extname(path).toLowerCase();
  if (!new Set([".jpg", ".jpeg", ".png"]).has(extension)) {
    throw new Error("Resume photo must be a JPG or PNG image");
  }

  const buffer = await readFile(path);
  const type = extension === ".png" ? "png" : "jpg";
  const mimeType = type === "png" ? "image/png" : "image/jpeg";
  return {
    path,
    buffer,
    type,
    mimeType,
    dataUri: `data:${mimeType};base64,${buffer.toString("base64")}`,
    alt: data.photo.alt,
  };
};

export const loadResumeData = async ({ privateMode = false } = {}) => {
  const source = await loadYaml(resumeSource);
  const data = normalizeLegacyResume(source);
  const evidenceIndex = await buildEvidenceIndex();
  assertResumeShape(data);
  assertEvidence(data, evidenceIndex);
  const photo = await loadPhoto(data);

  let phone = null;
  if (privateMode) {
    const privateData = await loadYaml(privateSource).catch(() => null);
    if (!privateData || !phonePattern.test(privateData.phone ?? "")) {
      throw new Error("Submission build requires a valid phone in resume/private.local.yaml");
    }
    phone = privateData.phone;
  }

  return { data, evidenceIndex, phone, photo };
};

export const outputPaths = (data, privateMode = false) => {
  const directory = privateMode ? privateOutputDir : publicOutputDir;
  const base = data.meta.fileBaseName;
  return {
    directory,
    docx: join(directory, `${base}.docx`),
    pdf: join(directory, `${base}.pdf`),
  };
};

export const canonicalBlocks = (data, phone = null) => {
  const blocks = [];
  const add = (...values) => values.filter(Boolean).forEach((value) => blocks.push(String(value)));

  add(data.candidate.name, data.candidate.role, data.candidate.experienceLabel, textOf(data.candidate.educationSummary));
  add(...Object.values(data.contacts).filter((item) => item?.value).map((item) => `${item.label} ${item.value}`));
  if (phone) add(`Mobile ${phone}`);
  add("프로필", data.candidate.headline, ...data.candidate.summary.map(textOf));
  add("핵심 기술");
  for (const skill of data.skills) add(`${skill.label} ${skill.items.join(" · ")}`);

  add("경력");
  for (const entry of data.experiences) {
    add(`${entry.company} · ${entry.department}`);
    add(`${entry.role} · ${entry.status}`);
    if (entry.team) add(`팀 ${textOf(entry.team)}`);
    add(textOf(entry.context), `기여 ${textOf(entry.contribution)}`);
    for (const study of entry.caseStudies ?? []) {
      add(study.title);
      add(`문제·제약 ${textOf(study.problem)}`);
      add(`판단·구현 ${textOf(study.decision)}`);
      add(`검증·결과 ${textOf(study.verification)}`);
      add(`책임·한계 ${textOf(study.limitation)}`);
    }
    for (const highlight of entry.highlights ?? []) add(textOf(highlight));
    for (const contribution of entry.additionalContributions ?? []) add(`추가 기여 ${textOf(contribution)}`);
    add(`기술 ${entry.technologies.join(" · ")}`);
  }

  add("프로젝트");
  for (const project of data.selectedProjects) {
    add(project.title);
    add(...project.highlights.map(textOf), project.url);
  }

  add("교육 · 자격");
  for (const item of data.training) add(`교육 ${item.title} · ${item.detail}`);
  for (const item of data.certifications) add(`자격 ${item.title} · ${item.detail}`);

  return blocks;
};

export const normalizeText = (value) => value
  .replace(/[\u00a0\s]+/g, "")
  .trim();

export const assertBlocksInOrder = (documentText, blocks, label) => {
  const normalizedDocument = normalizeText(documentText);
  let cursor = 0;
  const missing = [];

  for (const block of blocks) {
    const normalizedBlock = normalizeText(block);
    const index = normalizedDocument.indexOf(normalizedBlock, cursor);
    if (index === -1) {
      missing.push(block);
      continue;
    }
    cursor = index + normalizedBlock.length;
  }

  if (missing.length) {
    throw new Error(`${label} is missing or reorders canonical blocks:\n- ${missing.slice(0, 8).join("\n- ")}`);
  }
};

export const patterns = {
  phone: /01[016789][ -]?\d{3,4}[ -]?\d{4}/g,
  forbiddenGap: forbiddenGapPattern,
};
