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
const textOf = (value) => typeof value === "string" ? value : value?.text;
const textItemsOf = (value) => (Array.isArray(value) ? value : [value])
  .map(textOf)
  .filter(Boolean);

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

  assert(data?.meta?.schemaVersion === 4, "meta.schemaVersion must be 4");
  assert(!("expectedPages" in (data?.meta ?? {})), "meta.expectedPages must not constrain resume length");
  assert(data?.candidate?.experienceLabel === "3년 7개월", "experience label must be 3년 7개월");
  assert(Boolean(textOf(data?.candidate?.professionalSummary)), "candidate.professionalSummary is required");
  assert(data?.candidate?.evidenceHighlights?.length === 3,
    "candidate.evidenceHighlights must contain exactly three evidence-backed highlights");
  for (const item of data?.candidate?.evidenceHighlights ?? []) {
    assert(Boolean(item.title && item.detail), "each candidate evidence highlight requires title and detail");
  }
  assert(!data?.photo, "the reference template does not use a portrait photo");
  assert(data?.education?.length === 1, "education must contain one university record");
  assert(data?.training?.length === 1, "training must contain the current AI program");
  assert(data?.certifications?.length === 2, "certifications must contain SQLD and PCCE");
  assert(Boolean(data?.contacts?.email?.value), "a public email is required");
  assert(Boolean(data?.contacts?.blog?.url && data?.contacts?.github?.url && data?.contacts?.portfolio?.url),
    "blog, GitHub and portfolio links are required");

  const experiences = data?.experiences ?? [];
  assert(experiences.length === 4, "experiences must contain four employers");
  assert(new Set(experiences.map((entry) => entry.company)).size === 4, "experience employers must be unique");
  for (const entry of experiences) {
    const cases = entry.caseStudies ?? [];
    assert(cases.length >= 1 && cases.length <= 2, `${entry.company} must contain one or two representative projects`);
    for (const study of cases) {
      assert(Boolean(study.title), `${entry.company} project title is required`);
      assert((study.technologies?.length ?? 0) >= 1, `${entry.company}/${study.title}: technologies are required`);
      assert(Boolean(textOf(study.problem)), `${entry.company}/${study.title}: problem is required`);
      assert(Boolean(textOf(study.role)), `${entry.company}/${study.title}: role is required`);
      assert(textItemsOf(study.decision).length >= 1, `${entry.company}/${study.title}: decision is required`);
      assert(textItemsOf(study.verification).length >= 1, `${entry.company}/${study.title}: verification is required`);
      assert(Boolean(textOf(study.limitation)), `${entry.company}/${study.title}: limitation is required`);
    }
  }

  const projects = data?.selectedProjects ?? [];
  assert(projects.map((project) => project.title).join(",") === "KExcel,WorkShield", "selectedProjects must contain KExcel and WorkShield only");
  for (const project of projects) {
    assert((project.technologies?.length ?? 0) >= 1, `${project.title} technologies are required`);
    assert(Boolean(textOf(project.problem)), `${project.title}: problem is required`);
    assert(Boolean(textOf(project.role)), `${project.title}: role is required`);
    assert(textItemsOf(project.decision).length >= 1, `${project.title}: decision is required`);
    assert(textItemsOf(project.verification).length >= 1, `${project.title}: verification is required`);
    assert(Boolean(textOf(project.limitation)), `${project.title}: limitation is required`);
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

  add(data.candidate.name);
  if (phone) add(phone);
  add(data.contacts.email.value, "Professional Summary", textOf(data.candidate.professionalSummary), "핵심 근거");
  for (const item of data.candidate.evidenceHighlights) add(item.title, item.detail);

  add("경력", data.candidate.experienceLabel);
  for (const entry of data.experiences) {
    add(entry.company, `${entry.period} | ${entry.department} | ${entry.role} | ${entry.status}`);
    add(`담당 ${textOf(entry.contribution)}`);
    if (entry.team) add(`팀 ${textOf(entry.team)}`);
    for (const study of entry.caseStudies ?? []) {
      add(study.title);
      if (study.period) add(study.period);
      add(`배경 ${textOf(study.problem)}`);
      add(`역할 ${textOf(study.role)}`);
      const results = textItemsOf(study.verification);
      add(`주요 성과 ${results[0]}`, ...results.slice(1));
      const implementations = textItemsOf(study.decision);
      add(`핵심 구현 ${implementations[0]}`, ...implementations.slice(1));
      add("기술스택", study.technologies.join(", "));
      add(`한계 ${textOf(study.limitation)}`);
    }
    if (entry.additionalContributions?.length) add("추가 기여");
    for (const contribution of entry.additionalContributions ?? []) add(textOf(contribution));
  }

  add("프로젝트");
  for (const project of data.selectedProjects) {
    add(`${project.title} · ${project.subtitle}`, `${project.period} | ${project.type}`);
    add(`배경 ${textOf(project.problem)}`);
    add(`역할 ${textOf(project.role)}`);
    const results = textItemsOf(project.verification);
    add(`주요 성과 ${results[0]}`, ...results.slice(1));
    const implementations = textItemsOf(project.decision);
    add(`핵심 구현 ${implementations[0]}`, ...implementations.slice(1));
    add("기술스택", project.technologies.join(", "));
    add(`한계 ${textOf(project.limitation)}`, project.url);
  }

  add("학력");
  for (const item of data.education) {
    add(item.school, `${item.period} | ${item.status} | ${item.major} | ${item.degree}`);
  }

  add("스킬");
  for (const item of data.skills.flatMap((group) => group.items)) add(item);

  add("수상/자격증/기타");
  for (const item of data.training) add(item.title, `${item.period} | 교육`, item.detail);
  for (const item of data.certifications) add(item.title, `${item.acquiredAt} | 자격증`, item.detail);

  add("링크");
  for (const key of ["blog", "github", "portfolio"]) {
    add(data.contacts[key].label, data.contacts[key].value);
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
