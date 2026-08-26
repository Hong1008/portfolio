import { readFile, writeFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import JSZip from "jszip";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium } from "playwright";
import {
  assertBlocksInOrder,
  canonicalBlocks,
  loadResumeData,
  normalizeText,
  outputPaths,
  patterns,
  resumeSource,
  root,
} from "./resume/model.mjs";
import { renderResumeHtml } from "./resume/render-html.mjs";

process.env.TMPDIR = "/tmp";
process.env.TMP = "/tmp";
process.env.TEMP = "/tmp";

const decodeXml = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&apos;", "'");

const extractDocx = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) throw new Error("DOCX does not contain word/document.xml");

  const text = decodeXml(documentXml
    .replace(/<w:tab\b[^>]*\/>/g, " ")
    .replace(/<w:br\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, ""));
  const mediaNames = Object.keys(zip.files).filter((name) => name.startsWith("word/media/") && !zip.files[name].dir);

  return { documentXml, text, mediaNames };
};

const extractPdf = async (buffer) => {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  await pdf.destroy();
  return { pageCount: pages.length, text: pages.join("\n") };
};

const inspectTableStructure = (documentXml) => {
  const tags = documentXml.match(/<\/?w:tbl\b[^>]*>/g) ?? [];
  let depth = 0;
  let maxDepth = 0;
  let tableCount = 0;
  for (const tag of tags) {
    if (tag.startsWith("</")) depth -= 1;
    else {
      depth += 1;
      tableCount += 1;
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  const fixedLayoutCount = (documentXml.match(/<w:tblLayout\b[^>]*w:type="fixed"[^>]*\/>/g) ?? []).length;
  return { tableCount, maxDepth, fixedLayoutCount };
};

const renderPdfScreenshots = async (buffer, privateMode) => {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const prefix = privateMode ? "resume-submission-page" : "resume-page";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.45 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    await writeFile(`/tmp/${prefix}-${pageNumber}.png`, canvas.toBuffer("image/png"));
  }
  const count = pdf.numPages;
  await pdf.destroy();
  return count;
};

const privateMode = process.argv.includes("--private");
const { data, phone } = await loadResumeData({ privateMode });
const paths = outputPaths(data, privateMode);
const [docxBuffer, pdfBuffer, sourceText, gitignore] = await Promise.all([
  readFile(paths.docx),
  readFile(paths.pdf),
  readFile(resumeSource, "utf8"),
  readFile(`${root}.gitignore`, "utf8"),
]);

const [docx, pdf] = await Promise.all([extractDocx(docxBuffer), extractPdf(pdfBuffer)]);
const docxTables = inspectTableStructure(docx.documentXml);
const failures = [];
const warnings = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const blocks = canonicalBlocks(data, phone);
try { assertBlocksInOrder(docx.text, blocks, "DOCX"); } catch (error) { failures.push(error.message); }
try { assertBlocksInOrder(pdf.text, blocks, "PDF"); } catch (error) { failures.push(error.message); }

const alignmentValues = [
  ...data.experiences.flatMap((entry) => [entry.period, ...entry.caseStudies.map((study) => study.period).filter(Boolean)]),
  ...data.selectedProjects.flatMap((project) => [project.period, project.type]),
  ...data.education.flatMap((item) => [item.period, item.major]),
  ...data.training.map((item) => item.period),
  ...data.certifications.map((item) => item.acquiredAt),
];
for (const [label, value] of [["DOCX", docx.text], ["PDF", pdf.text]]) {
  const normalized = normalizeText(value);
  for (const expected of alignmentValues) {
    check(normalized.includes(normalizeText(expected)), `${label}: aligned field is missing: ${expected}`);
  }
}

check(pdf.pageCount >= 1, "PDF: resume must contain at least one page");
check((docx.documentXml.match(/<w:br\b[^>]*w:type="page"[^>]*\/>/g) ?? []).length === 0,
  "DOCX: manual page breaks are not allowed in the flowing resume");
check(docxTables.tableCount >= data.experiences.length + 4,
  `DOCX: expected shallow alignment tables for header, companies and compact lists, found ${docxTables.tableCount}`);
check(docxTables.maxDepth === 1, `DOCX: nested layout tables are not allowed (depth ${docxTables.maxDepth})`);
check(docxTables.fixedLayoutCount === docxTables.tableCount,
  `DOCX: every alignment table must use fixed layout (${docxTables.fixedLayoutCount}/${docxTables.tableCount})`);
check(!/<w:txbxContent\b/.test(docx.documentXml), "DOCX: text boxes are not allowed");
check(!/<wp:anchor\b/.test(docx.documentXml), "DOCX: floating images are not allowed");
check(!/<wp:inline\b/.test(docx.documentXml), "DOCX: the reference template must not contain a portrait image");
check(!/<w:(hdrReference|ftrReference)\b/.test(docx.documentXml), "DOCX: headers and footers are not allowed");
check(docx.mediaNames.length === 0, `DOCX: the photo-free template must not embed media (found ${docx.mediaNames.length})`);
check(docxBuffer.byteLength < 2.5 * 1024 * 1024, "DOCX: file must remain below 2.5 MB");
check(pdfBuffer.byteLength < 2.5 * 1024 * 1024, "PDF: file must remain below 2.5 MB");

check(!(sourceText.match(patterns.phone) ?? []).length, "source: tracked resume data contains a mobile phone number");
for (const [label, value] of [["source", sourceText], ["DOCX", docx.text], ["PDF", pdf.text]]) {
  check(!patterns.forbiddenGap.test(value), `${label}: career-gap wording must not appear`);
}
if (privateMode) {
  check(Boolean(phone && normalizeText(docx.text).includes(normalizeText(phone))), "DOCX: submission resume is missing the private phone number");
  check(Boolean(phone && normalizeText(pdf.text).includes(normalizeText(phone))), "PDF: submission resume is missing the private phone number");
} else {
  check(!(docx.text.match(patterns.phone) ?? []).length, "DOCX: public resume contains a mobile phone number");
  check(!(pdf.text.match(patterns.phone) ?? []).length, "PDF: public resume contains a mobile phone number");
}

check(gitignore.includes("resume/private.local.yaml"), ".gitignore must exclude private resume contact");
check(gitignore.includes("resume/private-output/"), ".gitignore must exclude submission output");

const reviewedAt = new Date(`${data.meta.marketReviewedAt}T00:00:00Z`);
const ageDays = Math.floor((Date.now() - reviewedAt.getTime()) / 86_400_000);
if (ageDays > 90) warnings.push(`market review is ${ageDays} days old; refresh resume/MARKET_REVIEW.md`);

let browser;
try {
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 });
  await page.setContent(renderResumeHtml(data, phone), { waitUntil: "load" });
  const layout = await page.evaluate(() => {
    const main = document.querySelector("main");
    const summary = document.querySelector(".professional-summary");
    const summaryLabel = document.querySelector(".summary-label");
    const evidenceHighlights = document.querySelector(".evidence-highlights");
    const projectBody = document.querySelector(".project-highlights");
    const headings = [...document.querySelectorAll(".section-heading h2")];
    const headingLabels = headings.map((item) => item.childNodes[0]?.textContent?.trim());
    const companyDetails = document.querySelector(".company-details");
    const mainRect = main?.getBoundingClientRect();
    const detailsRect = companyDetails?.getBoundingClientRect();
    return {
      hasFixedPages: Boolean(document.querySelector(".page")),
      horizontalOverflow: Boolean(main && main.scrollWidth > main.clientWidth + 1),
      hasPortrait: Boolean(document.querySelector("img, .portrait")),
      nameBeforeSummary: Boolean(document.querySelector("h1") && summary
        && document.querySelector("h1").getBoundingClientRect().top < summary.getBoundingClientRect().top),
      summaryOrder: Boolean(summaryLabel && summary && evidenceHighlights && headings[0]
        && summaryLabel.getBoundingClientRect().top < summary.getBoundingClientRect().top
        && summary.getBoundingClientRect().top < evidenceHighlights.getBoundingClientRect().top
        && evidenceHighlights.getBoundingClientRect().top < headings[0].getBoundingClientRect().top),
      headingLabels,
      evidenceHighlightCount: document.querySelectorAll(".evidence-grid article").length,
      continuationCount: document.querySelectorAll(".project-highlights li.continuation").length,
      projectLabelOrders: [...document.querySelectorAll(".project-block")].map((block) =>
        [...block.querySelectorAll(":scope > .project-highlights > li > strong")]
          .map((item) => item.textContent.trim()).filter(Boolean)),
      companyCount: document.querySelectorAll(".experience").length,
      caseStudyCount: document.querySelectorAll(".experience .project-block").length,
      selectedProjectCount: document.querySelectorAll(".selected-project").length,
      technologyCount: document.querySelectorAll(".technology-block").length,
      scopeCount: document.querySelectorAll(".scope-summary").length,
      educationCount: document.querySelectorAll(".education-list .icon-row").length,
      skillCount: document.querySelectorAll(".skill-list span").length,
      credentialCount: document.querySelectorAll(".credential-row").length,
      linkCount: document.querySelectorAll(".link-row").length,
      topContactText: document.querySelector(".top-contacts")?.textContent ?? "",
      outerPadding: main ? Number.parseFloat(getComputedStyle(main).paddingLeft) : null,
      itemIndent: mainRect && detailsRect ? detailsRect.left - (mainRect.left + Number.parseFloat(getComputedStyle(main).paddingLeft)) : null,
      bodyFontSize: Number.parseFloat(getComputedStyle(document.body).fontSize),
      summaryFontSize: summary ? Number.parseFloat(getComputedStyle(summary).fontSize) : null,
      projectFontSize: projectBody ? Number.parseFloat(getComputedStyle(projectBody).fontSize) : null,
      projectLineHeight: projectBody ? Number.parseFloat(getComputedStyle(projectBody).lineHeight) : null,
      bodyLetterSpacing: Number.parseFloat(getComputedStyle(document.body).letterSpacing),
    };
  });

  const expectedHeadings = ["경력", "프로젝트", "학력", "스킬", "수상/자격증/기타", "링크"];
  const expectedCaseCount = data.experiences.reduce((sum, entry) => sum + entry.caseStudies.length, 0);
  const expectedSkillCount = new Set(data.skills.flatMap((group) => group.items)).size;
  const expectedContinuationCount = [
    ...data.experiences.flatMap((entry) => entry.caseStudies),
    ...data.selectedProjects,
  ].reduce((sum, project) => sum
    + Math.max(0, (Array.isArray(project.verification) ? project.verification.length : 1) - 1)
    + Math.max(0, (Array.isArray(project.decision) ? project.decision.length : 1) - 1), 0);
  check(!layout.hasFixedPages, "HTML: fixed .page containers must not constrain page count");
  check(!layout.horizontalOverflow, "HTML: horizontal overflow found");
  check(!layout.hasPortrait, "HTML: the reference template must remain photo-free");
  check(layout.nameBeforeSummary && layout.summaryOrder,
    "HTML: expected name → Professional Summary → evidence highlights → career order");
  check(layout.evidenceHighlightCount === 3,
    `HTML: expected three evidence highlights, found ${layout.evidenceHighlightCount}`);
  check(layout.continuationCount === expectedContinuationCount,
    `HTML: expected ${expectedContinuationCount} multi-line result/implementation continuations, found ${layout.continuationCount}`);
  check(layout.headingLabels.join("|") === expectedHeadings.join("|"),
    `HTML: unexpected section order: ${layout.headingLabels.join(" → ")}`);
  check(layout.companyCount === data.experiences.length, `HTML: expected ${data.experiences.length} companies, found ${layout.companyCount}`);
  check(layout.caseStudyCount === expectedCaseCount, `HTML: expected ${expectedCaseCount} career projects, found ${layout.caseStudyCount}`);
  check(layout.selectedProjectCount === data.selectedProjects.length,
    `HTML: expected ${data.selectedProjects.length} selected projects, found ${layout.selectedProjectCount}`);
  const expectedProjectLabels = "역할|주요 성과|핵심 구현|기술스택|한계";
  for (const labels of layout.projectLabelOrders) {
    check(labels.join("|") === expectedProjectLabels,
      `HTML: unexpected project field order: ${labels.join(" → ")}`);
  }
  check(layout.technologyCount === expectedCaseCount + data.selectedProjects.length,
    `HTML: every project must expose a technology block (${layout.technologyCount})`);
  check(layout.scopeCount === data.experiences.length, "HTML: every company must expose role and team scope");
  check(layout.educationCount === data.education.length, "HTML: education count mismatch");
  check(layout.skillCount === expectedSkillCount, `HTML: expected ${expectedSkillCount} skill chips, found ${layout.skillCount}`);
  check(layout.credentialCount === data.training.length + data.certifications.length, "HTML: credential count mismatch");
  check(layout.linkCount === 3, `HTML: expected three public link rows, found ${layout.linkCount}`);
  check(layout.topContactText.includes(data.contacts.email.value), "HTML: top contact line is missing the public email");
  check(layout.outerPadding !== null && Math.abs(layout.outerPadding - 51.4) < 2,
    `HTML: expected an approximately 13.6mm outer margin, found ${layout.outerPadding}px`);
  check(layout.itemIndent !== null && Math.abs(layout.itemIndent - 51.4) < 2,
    `HTML: expected an approximately 13.6mm item indent, found ${layout.itemIndent}px`);
  check(Math.abs(layout.bodyFontSize - 12) < 0.5, `HTML: expected 9pt body text, found ${layout.bodyFontSize}px`);
  check(layout.summaryFontSize !== null && Math.abs(layout.summaryFontSize - 13.6) < 0.7,
    `HTML: expected 10.2pt summary text, found ${layout.summaryFontSize}px`);
  check(layout.projectFontSize !== null && layout.projectFontSize >= 11.8,
    `HTML: project body text must remain approximately 9pt or larger, found ${layout.projectFontSize}px`);
  check(layout.projectLineHeight !== null && layout.projectFontSize !== null
    && layout.projectLineHeight / layout.projectFontSize >= 1.62,
  `HTML: project body line height is too tight (${layout.projectLineHeight}/${layout.projectFontSize})`);
  check(Number.isFinite(layout.bodyLetterSpacing) && layout.bodyLetterSpacing >= 0.05,
    `HTML: body letter spacing is too tight, found ${layout.bodyLetterSpacing}px`);

  await page.screenshot({ path: `/tmp/resume${privateMode ? "-submission" : ""}-preview.png`, fullPage: true });
} finally {
  await browser?.close();
}

const renderedPageCount = await renderPdfScreenshots(pdfBuffer, privateMode);
check(renderedPageCount === pdf.pageCount, "PDF: screenshot page count does not match extracted page count");

if (warnings.length) console.warn(`Resume verification warnings:\n- ${warnings.join("\n- ")}`);
if (failures.length) {
  console.error(`Resume verification failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  const audience = privateMode ? "submission" : "repository";
  const prefix = privateMode ? "resume-submission-page" : "resume-page";
  console.log(`Verified ${pdf.pageCount}-page ${audience} resume, reference layout, evidence references and contact boundary.`);
  console.log(`Preview: /tmp/resume${privateMode ? "-submission" : ""}-preview.png`);
  console.log(`PDF page screenshots: /tmp/${prefix}-{1..${pdf.pageCount}}.png`);
}
