import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const outputName = "hong-chulmin-portfolio.pdf";
const expectedPages = 7;
const publicOutput = join(root, "public", "documents", outputName);
const distOutput = join(dist, "documents", outputName);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const withoutBase = url.pathname.replace(/^\/portfolio(?=\/|$)/, "") || "/";
    const relative = withoutBase.endsWith("/") ? `${withoutBase}index.html` : withoutBase;
    const file = normalize(join(dist, relative));
    if (!file.startsWith(dist)) throw new Error("Invalid path");
    const body = await readFile(file);
    response.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4173/portfolio/print/", { waitUntil: "networkidle" });
  const pdf = await page.pdf({ format: "A4", printBackground: true, displayHeaderFooter: false, preferCSSPageSize: true });
  const pageCount = (Buffer.from(pdf).toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
  if (pageCount !== expectedPages) {
    throw new Error(`Expected ${expectedPages} PDF pages, generated ${pageCount}.`);
  }
  await mkdir(join(root, "public", "documents"), { recursive: true });
  await mkdir(join(dist, "documents"), { recursive: true });
  await Promise.all([writeFile(publicOutput, pdf), writeFile(distOutput, pdf)]);
  console.log(`Generated ${outputName}: ${pageCount} pages (${Math.round(pdf.byteLength / 1024)} KB)`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
