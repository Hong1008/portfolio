import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
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
    if (key === "refs" || key === "url") continue;
    if (typeof item === "string") text.push(item);
    else collectText(item, text);
  }
  return text;
};

const assertResumeShape = (data) => {
  const failures = [];
  const assert = (condition, message) => { if (!condition) failures.push(message); };

  assert(data?.meta?.schemaVersion === 1, "meta.schemaVersion must be 1");
  assert(data?.meta?.expectedPages === 3, "the resume must target exactly three pages");
  assert(data?.candidate?.experienceLabel === "백엔드 경력 3년 7개월", "experience label must be 3년 7개월");
  assert(data?.education?.length === 2, "education must contain university and current training");
  assert(data?.certifications?.length === 2, "certifications must contain SQLD and PCCE");
  assert(data?.careerSummary?.length === 4, "career summary must contain four employers");
  assert(data?.experiencePages?.map((page) => page.page).join(",") === "2,3", "experience detail must occupy pages 2 and 3");

  const experiences = data?.experiencePages?.flatMap((page) => page.entries) ?? [];
  assert(experiences.length === 4, "experience detail must contain four employers");
  assert(new Set(experiences.map((entry) => entry.company)).size === 4, "experience employers must be unique");
  assert(data?.projects?.map((project) => project.title).join(",") === "KExcel,WorkShield", "only KExcel and WorkShield may appear in projects");
  for (const project of data?.projects ?? []) {
    assert(project.sentences?.length === 2, `${project.title} must contain exactly two sentences`);
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

export const loadResumeData = async ({ privateMode = false } = {}) => {
  const data = await loadYaml(resumeSource);
  const evidenceIndex = await buildEvidenceIndex();
  assertResumeShape(data);
  assertEvidence(data, evidenceIndex);

  let phone = null;
  if (privateMode) {
    const privateData = await loadYaml(privateSource).catch(() => null);
    if (!privateData || !phonePattern.test(privateData.phone ?? "")) {
      throw new Error("Submission build requires a valid phone in resume/private.local.yaml");
    }
    phone = privateData.phone;
  }

  return { data, evidenceIndex, phone };
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

  add(data.candidate.name, data.candidate.role, data.candidate.experienceLabel);
  add(...Object.values(data.contacts).filter((item) => item?.value).map((item) => `${item.label} ${item.value}`));
  if (phone) add(`Mobile ${phone}`);
  add("학력 · 교육 · 자격");
  for (const item of data.education) add(`${item.label} ${item.title} · ${item.detail} ${item.period}`);
  for (const item of data.certifications) add(`자격 ${item.title} · ${item.detail} ${item.acquiredAt}`);
  add("프로필", data.candidate.headline, ...data.candidate.summary);
  add("핵심 기술");
  for (const skill of data.skills) add(`${skill.label} ${skill.items.join(" · ")}`);
  add("경력 요약");
  for (const career of data.careerSummary) add(`${career.company} · ${career.role} ${career.period}`, career.achievement);

  for (const page of data.experiencePages) {
    add(page.page === 2 ? "경력 상세" : "경력 상세 · 계속");
    for (const entry of page.entries) {
      add(`${entry.company} · ${entry.department} ${entry.period}`);
      add(`${entry.role} · ${entry.status}`);
      add(entry.context, `기여 ${entry.contribution}`, ...entry.bullets.map((bullet) => bullet.text));
      add(`기술 ${entry.technologies.join(" · ")}`);
    }
    if (page.page === 3) {
      add("프로젝트");
      for (const project of data.projects) {
        add(`${project.title} · ${project.subtitle} ${project.period} · ${project.type}`);
        add(...project.sentences.map((sentence) => sentence.text));
        add(project.url);
      }
    }
  }

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
