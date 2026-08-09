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
  "/portfolio/projects/workshield-mcp/",
  "/portfolio/projects/workshield-web/",
  "/portfolio/projects/kexcel/",
  "/portfolio/projects/movie-box-office/",
  "/portfolio/projects/ev-infrastructure/",
  "/portfolio/print/",
  "/portfolio/404.html",
  "/portfolio/sitemap.xml",
  "/portfolio/robots.txt",
  "/portfolio/documents/hong-chulmin-portfolio.pdf",
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
const countPdfPages = (pdf) => (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
await mkdir(screenshotDir, { recursive: true });
await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ args: ["--no-sandbox"] });
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
      const mermaidOutOfViewBox = [...document.querySelectorAll('svg[id^="mermaid"]')]
        .map((svg) => {
          const viewBox = svg.viewBox.baseVal;
          const bounds = svg.getBBox();
          const tolerance = 2;
          return bounds.x < viewBox.x - tolerance
            || bounds.y < viewBox.y - tolerance
            || bounds.x + bounds.width > viewBox.x + viewBox.width + tolerance
            || bounds.y + bounds.height > viewBox.y + viewBox.height + tolerance;
        })
        .filter(Boolean).length;
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
        mermaidOutOfViewBox,
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
    check(audit.mermaidOutOfViewBox === 0, `${path}: ${audit.mermaidOutOfViewBox} Mermaid SVGs exceed their viewBox`);
    check(!audit.overflow, `${path}: horizontal document overflow at 1440px`);
  }
  for (const href of internalLinks) {
    const response = await fetch(`http://127.0.0.1:4174${href}`);
    check(response.ok, `internal link ${href}: HTTP ${response.status}`);
  }

  const generatedPdf = await readFile(join(dist, "documents", "hong-chulmin-portfolio.pdf"));
  check(countPdfPages(generatedPdf) === 7, `generated PDF: expected 7 physical pages, found ${countPdfPages(generatedPdf)}`);

  const responsivePaths = [
    "/portfolio/",
    "/portfolio/experience/",
    "/portfolio/projects/",
    "/portfolio/experience/hodoolabs/",
    "/portfolio/projects/kexcel/",
    "/portfolio/projects/workshield-web/",
  ];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of responsivePaths) {
      await page.goto(`http://127.0.0.1:4174${path}`, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      check(!overflow, `${path}: horizontal overflow at ${width}px`);
    }
    await page.goto("http://127.0.0.1:4174/portfolio/", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${screenshotDir}/home-${width}.png`, fullPage: true });
  }
  const homeAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    const featuredTitles = [...document.querySelectorAll(".featured-cases h3")].map((item) => item.textContent?.trim());
    const parseRgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (rgb) => {
      const [r, g, b] = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (foreground, background) => {
      const values = [luminance(parseRgb(foreground)), luminance(parseRgb(background))].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const primary = document.querySelector(".button.primary");
    const primaryStyle = primary ? getComputedStyle(primary) : null;
    return {
      text,
      featuredTitles,
      primaryContrast: primaryStyle ? ratio(primaryStyle.color, primaryStyle.backgroundColor) : 0,
    };
  });
  check(homeAudit.text.includes("약 4년"), "home: missing approximate experience label");
  check(homeAudit.text.includes("Java/Kotlin·Spring"), "home: missing JVM backend foundation");
  check(homeAudit.text.includes("중복·재실행") && homeAudit.text.includes("외부 연동 실패"), "home: missing core problem signals");
  check(homeAudit.text.includes("AI 서비스 백엔드"), "home: missing AI service backend expansion signal");
  check(!/\bJunior\b|AI Engineer|생산성.{0,8}(향상|개선)/i.test(homeAudit.text), "home: contains disallowed rebranding or unsupported productivity claim");
  check(!/Selected work|More projects|Engineering principles/.test(homeAudit.text), "home: contains decorative English section labels");
  check(homeAudit.featuredTitles.join("|") === "호두랩스|KExcel — Kotlin DSL 기반 대용량 엑셀 생성 라이브러리|WorkShield Web — 실패 경계를 설계한 AI 서비스 백엔드", "home: featured case order mismatch");
  check(homeAudit.primaryContrast >= 4.5, `home: primary button contrast ${homeAudit.primaryContrast.toFixed(2)} is below 4.5`);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("http://127.0.0.1:4174/portfolio/experience/hodoolabs/", { waitUntil: "networkidle" });
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)), "hodoolabs: horizontal overflow at 390px");
  await page.screenshot({ path: `${screenshotDir}/hodoolabs-390.png`, fullPage: true });
  await page.keyboard.press("Tab");
  check(await page.locator(".skip-link").evaluate((item) =>
    document.activeElement === item && item.getBoundingClientRect().top >= 0), "skip link is not visible on keyboard focus");

  await page.goto("http://127.0.0.1:4174/portfolio/projects/workshield-web/", { waitUntil: "networkidle" });
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)), "workshield-web: horizontal overflow at 390px");
  const workshieldSummaryAudit = await page.evaluate(() => {
    const summary = document.querySelector(".summary-card");
    const technologies = document.querySelector(".technology-summary");
    const metadataLabels = [...document.querySelectorAll(".metadata-list dt")].map((item) => item.textContent?.trim());
    const summaryText = document.querySelector(".content-summary")?.textContent ?? "";
    return {
      summaryBeforeTechnologies: Boolean(summary && technologies && (summary.compareDocumentPosition(technologies) & Node.DOCUMENT_POSITION_FOLLOWING)),
      metadataLabels,
      primaryTechnologyCount: document.querySelectorAll(".technology-summary > .technology-list > li").length,
      summaryText,
    };
  });
  check(workshieldSummaryAudit.summaryBeforeTechnologies, "workshield-web: technology list must follow the 30-second summary");
  check(!workshieldSummaryAudit.metadataLabels.includes("기술"), "workshield-web: technology list still appears in header metadata");
  check(workshieldSummaryAudit.primaryTechnologyCount <= 4, `workshield-web: expected at most four primary technologies, found ${workshieldSummaryAudit.primaryTechnologyCount}`);
  check(!/Review Aggregate|낙관적 잠금|CDK synth|partial UNIQUE index/.test(workshieldSummaryAudit.summaryText), "workshield-web: first summary still contains implementation-heavy terms");
  await page.screenshot({ path: `${screenshotDir}/workshield-web-390.png`, fullPage: true });

  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("http://127.0.0.1:4174/portfolio/print/", { waitUntil: "networkidle" });
  check((await page.locator(".print-page").count()) === 7, "print page does not contain exactly seven sections");
  await page.locator(".print-page").first().screenshot({ path: `${screenshotDir}/print-cover.png` });
  await page.locator(".print-page").nth(4).screenshot({ path: `${screenshotDir}/print-workshield-web.png` });

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
