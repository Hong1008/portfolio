import { getPublicEntries } from "../lib/content";
import { DEPLOYED_SITE_URL } from "../lib/site";

export const prerender = true;

export async function GET() {
  const entries = await getPublicEntries();
  const paths = [
    "",
    "experience/",
    "projects/",
    "print/",
    ...entries.map((entry) =>
      `${entry.data.contentType === "experience" ? "experience" : "projects"}/${entry.data.slug}/`),
  ];
  const urls = paths.map((path) => `<url><loc>${new URL(path, DEPLOYED_SITE_URL)}</loc></url>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
