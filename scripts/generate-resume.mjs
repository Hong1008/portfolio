import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { loadResumeData, outputPaths } from "./resume/model.mjs";
import { renderDocx } from "./resume/render-docx.mjs";
import { renderResumeHtml } from "./resume/render-html.mjs";

process.env.TMPDIR = "/tmp";
process.env.TMP = "/tmp";
process.env.TEMP = "/tmp";

const privateMode = process.argv.includes("--private");
const { data, phone } = await loadResumeData({ privateMode });
const paths = outputPaths(data, privateMode);
await mkdir(paths.directory, { recursive: true });

const html = renderResumeHtml(data, phone);
const docx = await renderDocx(data, phone);

let browser;
let pdf;
try {
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: false,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
} finally {
  await browser?.close();
}

await Promise.all([
  writeFile(paths.docx, docx),
  writeFile(paths.pdf, pdf),
]);

const audience = privateMode ? "submission" : "repository";
console.log(`Generated ${audience} resume:`);
console.log(`- ${paths.docx} (${Math.round(docx.byteLength / 1024)} KB)`);
console.log(`- ${paths.pdf} (${Math.round(pdf.byteLength / 1024)} KB)`);
