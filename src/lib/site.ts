export const SITE_NAME = "홍철민 | 백엔드 개발자 포트폴리오";
export const SITE_DESCRIPTION =
  "실패 처리, 성능 분석과 AI 서비스 백엔드 사례를 문제·판단·검증·한계 중심으로 정리한 포트폴리오입니다.";
export const DEPLOYED_SITE_URL = "https://hong1008.github.io/portfolio/";

export function withBase(path = "") {
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\/+/, "");
  return `${base}${normalized}`;
}

export function contentPath(contentType: "experience" | "project", slug: string) {
  const collection = contentType === "experience" ? "experience" : "projects";
  return withBase(`${collection}/${slug}/`);
}

export function absoluteSiteUrl(path = "") {
  return new URL(path.replace(/^\/+/, ""), DEPLOYED_SITE_URL).toString();
}

export function formatPeriod(
  startDate: string,
  endDate: string | null,
  precision: "month" | "year",
) {
  const format = (value: string) =>
    precision === "year" ? value.slice(0, 4) : value.replace("-", ".");
  return `${format(startDate)}–${endDate ? format(endDate) : "현재"}`;
}
