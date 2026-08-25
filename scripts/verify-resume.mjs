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

  return { zip, documentXml, text, mediaNames };
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
    if (tag.startsWith("</")) {
      depth -= 1;
    } else {
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
    const canvasContext = canvas.getContext("2d");
    await page.render({ canvasContext, viewport }).promise;
    await writeFile(`/tmp/${prefix}-${pageNumber}.png`, canvas.toBuffer("image/png"));
  }
  const count = pdf.numPages;
  await pdf.destroy();
  return count;
};

const privateMode = process.argv.includes("--private");
const { data, phone, photo } = await loadResumeData({ privateMode });
const paths = outputPaths(data, privateMode);
const [docxBuffer, pdfBuffer, sourceText, gitignore] = await Promise.all([
  readFile(paths.docx),
  readFile(paths.pdf),
  readFile(resumeSource, "utf8"),
  readFile(`${root}.gitignore`, "utf8"),
]);

const docx = await extractDocx(docxBuffer);
const pdf = await extractPdf(pdfBuffer);
const docxTables = inspectTableStructure(docx.documentXml);
const failures = [];
const warnings = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const blocks = canonicalBlocks(data, phone);
try { assertBlocksInOrder(docx.text, blocks, "DOCX"); } catch (error) { failures.push(error.message); }
try { assertBlocksInOrder(pdf.text, blocks, "PDF"); } catch (error) { failures.push(error.message); }

const alignmentValues = [
  ...data.experiences.map((entry) => entry.period),
  ...data.selectedProjects.flatMap((project) => [project.subtitle, project.period, project.type]),
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
check(docxTables.tableCount >= 15, `DOCX: expected shallow alignment tables, found ${docxTables.tableCount}`);
check(docxTables.maxDepth === 1, `DOCX: nested layout tables are not allowed (depth ${docxTables.maxDepth})`);
check(docxTables.fixedLayoutCount === docxTables.tableCount,
  `DOCX: every alignment table must use fixed layout (${docxTables.fixedLayoutCount}/${docxTables.tableCount})`);
check(!/<w:txbxContent\b/.test(docx.documentXml), "DOCX: text boxes are not allowed");
check(!/<wp:anchor\b/.test(docx.documentXml), "DOCX: floating images are not allowed; use an inline image in the header table");
check((docx.documentXml.match(/<wp:inline\b/g) ?? []).length === 1, "DOCX: expected one inline portrait image");
check(!/<w:(hdrReference|ftrReference)\b/.test(docx.documentXml), "DOCX: headers and footers are not allowed");
check(docx.mediaNames.length === 1, `DOCX: expected one portrait image, found ${docx.mediaNames.length}`);
if (photo && docx.mediaNames.length === 1) {
  const embeddedPhoto = await docx.zip.file(docx.mediaNames[0]).async("nodebuffer");
  check(Buffer.compare(embeddedPhoto, photo.buffer) === 0, "DOCX: embedded portrait does not match the configured source image");
}
check(docxBuffer.byteLength < 2.5 * 1024 * 1024, "DOCX: file must remain below 2.5 MB");
check(pdfBuffer.byteLength < 2.5 * 1024 * 1024, "PDF: file must remain below 2.5 MB");

check(!(sourceText.match(patterns.phone) ?? []).length, "source: tracked resume data contains a mobile phone number");
for (const [label, value] of [["source", sourceText], ["DOCX", docx.text], ["PDF", pdf.text]]) {
  check(!patterns.forbiddenGap.test(value), `${label}: career-gap wording must not appear`);
}
if (privateMode) {
  check(Boolean(phone && docx.text.includes(phone)), "DOCX: submission resume is missing the private phone number");
  check(Boolean(phone && pdf.text.replace(/\s+/g, "").includes(phone)), "PDF: submission resume is missing the private phone number");
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
  await page.setContent(renderResumeHtml(data, phone, photo), { waitUntil: "load" });
  const layout = await page.evaluate(() => {
    const main = document.querySelector("main");
    const portrait = document.querySelector(".portrait");
    const educationSummary = document.querySelector(".education-summary");
    const headings = [...document.querySelectorAll("h2")];
    const heading = (label) => headings.find((item) => item.querySelector("span")?.textContent?.trim() === label);
    const profile = heading("프로필");
    const experience = heading("경력");
    const projects = heading("프로젝트");
    const finalDetails = heading("교육 · 자격");
    const compact = document.querySelector(".experience.compact");
    const finalDetailsText = document.querySelector(".final-details")?.textContent ?? "";
    return {
      hasFixedPages: Boolean(document.querySelector(".page")),
      horizontalOverflow: Boolean(main && main.scrollWidth > main.clientWidth + 1),
      portrait: portrait ? {
        width: portrait.getBoundingClientRect().width,
        height: portrait.getBoundingClientRect().height,
        naturalWidth: portrait.naturalWidth,
        naturalHeight: portrait.naturalHeight,
      } : null,
      educationBeforeProfile: Boolean(educationSummary && profile && educationSummary.getBoundingClientRect().top < profile.getBoundingClientRect().top),
      sectionOrder: Boolean(profile && experience && projects && finalDetails
        && profile.getBoundingClientRect().top < experience.getBoundingClientRect().top
        && experience.getBoundingClientRect().top < projects.getBoundingClientRect().top
        && projects.getBoundingClientRect().top < finalDetails.getBoundingClientRect().top),
      projectCount: document.querySelectorAll(".projects article").length,
      projectHighlightCounts: [...document.querySelectorAll(".projects article")].map((item) => item.querySelectorAll("li").length),
      layoutTableCount: document.querySelectorAll("table.layout-table").length,
      headerUsesTable: document.querySelector("table.header-table") !== null,
      caseTableCount: document.querySelectorAll("table.case-table").length,
      entryHeadingTableCount: document.querySelectorAll("table.entry-heading").length,
      compactCaseCount: compact?.querySelectorAll(".case-study").length ?? -1,
      compactHighlightCount: compact?.querySelectorAll(".highlights li").length ?? -1,
      finalDetailsContainsUniversity: finalDetailsText.includes("연성대학교"),
    };
  });

  check(!layout.hasFixedPages, "HTML: fixed .page containers must not constrain page count");
  check(!layout.horizontalOverflow, "HTML: horizontal overflow found");
  check(Boolean(layout.portrait), "HTML: portrait image is missing");
  if (layout.portrait) {
    check(layout.portrait.naturalWidth === 354 && layout.portrait.naturalHeight === 472,
      `HTML: unexpected portrait source dimensions ${layout.portrait.naturalWidth}x${layout.portrait.naturalHeight}`);
    check(Math.abs(layout.portrait.width / layout.portrait.height - 0.75) < 0.01, "HTML: portrait aspect ratio is distorted");
  }
  check(layout.educationBeforeProfile, "HTML: university summary must appear in the header before profile");
  check(layout.sectionOrder, "HTML: expected profile → experience → projects → training/certification order");
  check(layout.projectCount === 2, `HTML: expected two selected projects, found ${layout.projectCount}`);
  check(layout.projectHighlightCounts.every((count) => count === 2), "HTML: each selected project must contain exactly two highlights");
  check(layout.layoutTableCount >= 15, `HTML: expected shallow alignment tables, found ${layout.layoutTableCount}`);
  check(layout.headerUsesTable, "HTML: header must use a table to align identity and portrait");
  check(layout.caseTableCount === 5, `HTML: expected five case-study alignment tables, found ${layout.caseTableCount}`);
  check(layout.entryHeadingTableCount === 6,
    `HTML: expected four experience and two project heading tables, found ${layout.entryHeadingTableCount}`);
  check(layout.compactCaseCount === 0 && layout.compactHighlightCount === 1,
    "HTML: G2E must remain a compact experience with one highlight and no case study");
  check(!layout.finalDetailsContainsUniversity, "HTML: university must not be repeated in the final training/certification section");

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
  console.log(`Verified ${pdf.pageCount}-page ${audience} resume, portrait, flowing layout, evidence references and contact boundary.`);
  console.log(`Preview: /tmp/resume${privateMode ? "-submission" : ""}-preview.png`);
  console.log(`PDF page screenshots: /tmp/${prefix}-{1..${pdf.pageCount}}.png`);
}
