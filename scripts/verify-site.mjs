import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const screenshotDir = "/tmp/portfolio-site-audit";
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".pdf": "application/pdf", ".xml": "application/xml", ".txt": "text/plain" };
const paths = [
  "/portfolio/",
  "/portfolio/experience/",
  "/portfolio/experience/shopl/",
  "/portfolio/experience/hunik/",
  "/portfolio/experience/hodoolabs/",
  "/portfolio/experience/g2e/",
  "/portfolio/projects/",
  "/portfolio/projects/workshield/",
  "/portfolio/projects/kexcel/",
  "/portfolio/projects/movie-box-office/",
  "/portfolio/projects/ev-infrastructure/",
  "/portfolio/print/",
  "/portfolio/404.html",
  "/portfolio/sitemap.xml",
  "/portfolio/robots.txt",
  "/portfolio/documents/hong-cheolmin-portfolio.pdf",
];

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

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
await mkdir(screenshotDir, { recursive: true });
await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", args: ["--no-sandbox"] });
  for (const path of paths) {
    const response = await fetch(`http://127.0.0.1:4174${path}`);
    check(response.ok, `${path}: HTTP ${response.status}`);
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const internalLinks = new Set();
  for (const path of paths.filter((path) => path.endsWith("/") || path.endsWith(".html"))) {
    await page.goto(`http://127.0.0.1:4174${path}`, { waitUntil: "networkidle" });
    const audit = await page.evaluate(() => {
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((item) => Number(item.tagName.slice(1)));
      const skipped = headings.some((level, index) => index > 0 && level > headings[index - 1] + 1);
      const unnamedLinks = [...document.querySelectorAll("a")].filter((item) => !(item.textContent ?? "").trim() && !item.getAttribute("aria-label")).length;
      const inaccessibleSvg = [...document.querySelectorAll("svg")].filter((item) => !item.querySelector("title") && !item.getAttribute("aria-label") && !item.getAttribute("aria-labelledby")).length;
      const tablesWithoutHeaders = [...document.querySelectorAll("table")].filter((item) => !item.querySelector("th")).length;
      return {
        h1: document.querySelectorAll("h1").length,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
        skipped,
        unnamedLinks,
        inaccessibleSvg,
        tablesWithoutHeaders,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        internalLinks: [...document.querySelectorAll("a[href]")]
          .map((item) => item.getAttribute("href"))
          .filter((href) => href?.startsWith("/portfolio/")),
      };
    });
    audit.internalLinks.forEach((href) => internalLinks.add(href.split("#")[0]));
    check(audit.h1 === 1, `${path}: expected one h1, found ${audit.h1}`);
    check(Boolean(audit.title && audit.description && audit.canonical && audit.ogTitle), `${path}: missing SEO metadata`);
    check(!audit.skipped, `${path}: skipped heading level`);
    check(audit.unnamedLinks === 0, `${path}: ${audit.unnamedLinks} unnamed links`);
    check(audit.inaccessibleSvg === 0, `${path}: ${audit.inaccessibleSvg} SVGs without accessible names`);
    check(audit.tablesWithoutHeaders === 0, `${path}: tables without headers`);
    check(!audit.overflow, `${path}: horizontal document overflow at 1440px`);
  }
  for (const href of internalLinks) {
    const response = await fetch(`http://127.0.0.1:4174${href}`);
    check(response.ok, `internal link ${href}: HTTP ${response.status}`);
  }

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("http://127.0.0.1:4174/portfolio/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(!overflow, `home: horizontal overflow at ${width}px`);
    await page.screenshot({ path: `${screenshotDir}/home-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("http://127.0.0.1:4174/portfolio/experience/hodoolabs/", { waitUntil: "networkidle" });
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)), "hodoolabs: horizontal overflow at 390px");
  await page.screenshot({ path: `${screenshotDir}/hodoolabs-390.png`, fullPage: true });
  await page.keyboard.press("Tab");
  check(await page.locator(".skip-link").evaluate((item) =>
    document.activeElement === item && item.getBoundingClientRect().top >= 0), "skip link is not visible on keyboard focus");

  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("http://127.0.0.1:4174/portfolio/print/", { waitUntil: "networkidle" });
  check((await page.locator(".print-page").count()) === 7, "print page does not contain exactly seven sections");
  await page.locator(".print-page").first().screenshot({ path: `${screenshotDir}/print-cover.png` });

  if (failures.length) {
    console.error(`Site verification failed:\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`Verified ${paths.length} routes, responsive layouts, headings, metadata and accessibility basics.`);
    console.log(`Screenshots: ${screenshotDir}`);
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
