import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium } from "playwright";
import {
  assertBlocksInOrder,
  canonicalBlocks,
  loadResumeData,
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

  return { zip, documentXml, text };
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

const privateMode = process.argv.includes("--private");
const { data, phone } = await loadResumeData({ privateMode });
const paths = outputPaths(data, privateMode);
const [docxBuffer, pdfBuffer, sourceText, gitignore] = await Promise.all([
  readFile(paths.docx),
  readFile(paths.pdf),
  readFile(resumeSource, "utf8"),
  readFile(`${root}.gitignore`, "utf8"),
]);

const docx = await extractDocx(docxBuffer);
const pdf = await extractPdf(pdfBuffer);
const failures = [];
const warnings = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const blocks = canonicalBlocks(data, phone);
try { assertBlocksInOrder(docx.text, blocks, "DOCX"); } catch (error) { failures.push(error.message); }
try { assertBlocksInOrder(pdf.text, blocks, "PDF"); } catch (error) { failures.push(error.message); }

check(pdf.pageCount === data.meta.expectedPages, `PDF: expected ${data.meta.expectedPages} pages, found ${pdf.pageCount}`);
check((docx.documentXml.match(/<w:br\b[^>]*w:type="page"[^>]*\/>/g) ?? []).length === data.meta.expectedPages - 1,
  "DOCX: explicit page break count does not match three-page layout");
check(!/<w:tbl\b/.test(docx.documentXml), "DOCX: layout tables are not allowed");
check(!/<w:txbxContent\b/.test(docx.documentXml), "DOCX: text boxes are not allowed");
check(!/<w:(hdrReference|ftrReference)\b/.test(docx.documentXml), "DOCX: headers and footers are not allowed");
check(!Object.keys(docx.zip.files).some((name) => name.startsWith("word/media/")), "DOCX: images are not allowed");
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
  await page.setContent(renderResumeHtml(data, phone), { waitUntil: "load" });
  const layout = await page.evaluate(() => {
    const pages = [...document.querySelectorAll(".page")];
    const firstPage = pages[0];
    const education = firstPage.querySelector(".compact-list");
    const profile = firstPage.querySelector(".headline");
    const projectSection = pages[2].querySelector(".projects");
    return {
      pageCount: pages.length,
      overflows: pages.map((item) => item.scrollHeight > item.clientHeight + 1),
      educationBeforeProfile: Boolean(education && profile && education.getBoundingClientRect().top < profile.getBoundingClientRect().top),
      projectShare: projectSection ? projectSection.getBoundingClientRect().height / pages[2].getBoundingClientRect().height : 1,
      projectAfterExperiences: Boolean(projectSection && [...pages[2].querySelectorAll(".experience")].every((item) =>
        item.getBoundingClientRect().bottom <= projectSection.getBoundingClientRect().top + 1)),
    };
  });

  check(layout.pageCount === 3, `HTML model: expected 3 pages, found ${layout.pageCount}`);
  check(!layout.overflows.some(Boolean), `HTML model: page overflow found at ${layout.overflows.map((value, index) => value ? index + 1 : null).filter(Boolean).join(", ")}`);
  check(layout.educationBeforeProfile, "HTML model: education and certifications must appear above profile and career summary");
  check(layout.projectAfterExperiences, "HTML model: projects must appear after every experience entry");
  check(layout.projectShare <= 0.20, `HTML model: projects occupy ${(layout.projectShare * 100).toFixed(1)}% of the last page, above 20%`);

  for (const pageNumber of [1, 2, 3]) {
    const prefix = privateMode ? "resume-submission-page" : "resume-page";
    await page.locator(`.page[data-page="${pageNumber}"]`).screenshot({ path: `/tmp/${prefix}-${pageNumber}.png` });
  }
} finally {
  await browser?.close();
}

if (warnings.length) console.warn(`Resume verification warnings:\n- ${warnings.join("\n- ")}`);
if (failures.length) {
  console.error(`Resume verification failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  const audience = privateMode ? "submission" : "repository";
  console.log(`Verified 3-page ${audience} resume, evidence references, ATS-safe DOCX structure and contact boundary.`);
  console.log(`Preview screenshots: /tmp/resume${privateMode ? "-submission" : ""}-page-{1,2,3}.png`);
}
