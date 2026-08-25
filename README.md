# Portfolio

홍철민의 경력과 프로젝트를 문제, 직접 역할, 기술적 판단, 결과와 검증 근거 중심으로 관리하는 Astro 정적 포트폴리오다.

## 현재 구성

- 경력 4개: 샤플앤컴퍼니, 휴니크, 호두랩스, 지투이
- 프로젝트 4개: WorkShield, KExcel, 영화 흥행 예측, 전기차 충전 인프라
- 명시적 관련 사례 연결과 이전·다음 탐색
- 7페이지 제출용 PDF 자동 생성
- GitHub Pages base path, sitemap, robots, 404, SEO·Open Graph 메타데이터
- 정적 경로·내부 링크·반응형·기초 접근성 자동 검증

## 작업 전 읽을 문서

1. [AGENTS.md](./AGENTS.md)
2. [SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md)
3. [CONTENT_MODEL.md](./docs/CONTENT_MODEL.md)
4. [CONTENT_INVENTORY.md](./docs/CONTENT_INVENTORY.md)
5. [CLAIM_AUDIT.md](./docs/CLAIM_AUDIT.md)

## 데이터 흐름

```text
MDX 콘텐츠 + YAML evidence + 명시적 relations
  → Astro Content Collection / Zod 검증
  → 홈·목록·상세·관련 사례·인쇄 페이지
  → GitHub Pages 정적 빌드 + PDF
```

콘텐츠는 `src/content`, 근거는 `src/data/evidence`, 관계는 `src/data/relations`에서 관리한다. 공개 콘텐츠는 같은 slug의 evidence가 없거나 관계가 존재하지 않는 slug를 참조하면 빌드가 실패한다.

## 실행과 검증

Node.js 22.12 이상이 필요하다.

```bash
npm ci
npm run dev
npm run build:portfolio
npm run verify
```

- `build`: Astro 정적 빌드와 Mermaid SVG 변환
- `pdf`: 빌드된 `/print/` 페이지에서 A4 PDF 생성
- `build:portfolio`: 사이트 빌드 후 `public/documents/hong-chulmin-portfolio.pdf` 갱신
- `verify`: 전체 경로와 내부 링크, SEO 메타데이터, 헤딩·SVG 접근성, 390·768·1440px 레이아웃 검증

Mermaid와 PDF 생성, 화면 검증에는 headless Chrome이 필요하다.

## 배포

배포 주소는 `https://hong1008.github.io/portfolio/`다. `main` 또는 `master` 브랜치에 반영되면 `.github/workflows/deploy.yml`이 사이트와 PDF를 생성해 GitHub Pages에 배포한다.
