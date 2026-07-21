# Portfolio

소프트웨어 엔지니어의 경력과 프로젝트를 장기적으로 관리하는 정적 포트폴리오 사이트입니다.

## 프로젝트 성격

Astro 7 + MDX 기반 정적 포트폴리오다. 핵심 원칙은 기술 나열보다 문제·판단·검증·기여 범위·한계를 근거와 함께 서술하는 것이다.

작업 전 반드시 다음 순서로 읽는다.

1. [AGENTS.md](/home/hong/project/my/portfolio/AGENTS.md)
2. [SOURCE_OF_TRUTH.md](/home/hong/project/my/portfolio/docs/SOURCE_OF_TRUTH.md)
3. [CONTENT_MODEL.md](/home/hong/project/my/portfolio/docs/CONTENT_MODEL.md)
4. [CLAIM_AUDIT.md](/home/hong/project/my/portfolio/docs/CLAIM_AUDIT.md)

사실 충돌 시 `사용자 확인 → 실행 코드 → 공식 문서·테스트 → 이력서 → 회고 → README` 순으로 판단한다. 확인되지 않은 정보는 채우지 않는다.

## 현재 구현

공개 콘텐츠는 3개다.

- 경력: `hodoolabs`, `shopl`
- 프로젝트: `kexcel`, `workshield`

기술 구조:

```text
MDX 콘텐츠
  → Astro Content Collection + Zod 스키마
  → 공개 여부 및 evidence 연결 검증
  → 목록·홈·정적 상세 경로 자동 생성
  → 공통 CaseStudyLayout
```

핵심 파일:

- 스키마: [content.config.ts](/home/hong/project/my/portfolio/src/content.config.ts)
- 조회·교차 검증: [content.ts](/home/hong/project/my/portfolio/src/lib/content.ts)
- 상세 레이아웃: [CaseStudyLayout.astro](/home/hong/project/my/portfolio/src/layouts/CaseStudyLayout.astro)
- 공통 컴포넌트: [src/components/content](/home/hong/project/my/portfolio/src/components/content)
- 스타일·인쇄 CSS: [global.css](/home/hong/project/my/portfolio/src/styles/global.css)
- 대표 경력 예제: [hodoolabs.mdx](/home/hong/project/my/portfolio/src/content/experience/hodoolabs.mdx)
- 대표 프로젝트 예제: [workshield.mdx](/home/hong/project/my/portfolio/src/content/projects/workshield.mdx)
- 벤치마크 중심 예제: [kexcel.mdx](/home/hong/project/my/portfolio/src/content/projects/kexcel.mdx)

## 경력·프로젝트 추가 방법

페이지나 홈 카드 배열은 수정하지 않는다.

```text
1. SOURCE_OF_TRUTH에서 해당 사례의 확인된 사실과 공개 범위를 찾는다.
2. src/data/evidence/[slug].yaml을 먼저 작성한다.
3. src/content/experience/[slug].mdx
   또는 src/content/projects/[slug].mdx를 작성한다.
4. 핵심 주장을 docs/CLAIM_AUDIT.md에 추가한다.
5. npm run build로 스키마·참조·정적 렌더링을 검증한다.
```

콘텐츠 파일을 추가하면 다음이 자동 생성된다.

- 홈의 공개/대표 콘텐츠
- 경력 또는 프로젝트 목록
- `/experience/[slug]/` 또는 `/projects/[slug]/` 상세 페이지

`visibility: public`인 콘텐츠는 다음 조건을 만족해야 한다.

- `evidenceRef`와 같은 ID의 evidence 파일이 존재
- evidence의 `contentSlug`가 콘텐츠 `slug`와 일치
- 전체 경력·프로젝트에서 slug가 중복되지 않음

`featured: true`이면 홈 대표 사례 후보가 되고, `print.priority`가 작은 콘텐츠부터 최대 3개가 노출된다.

## 콘텐츠 작성 패턴

상단 frontmatter는 스키마를 그대로 따른다. 대표 콘텐츠에는 사실상 다음이 필요하다.

- `summary`
- `role`과 개인 기여 범위
- `caseSummary`: 문제, 판단, 역할, 검증, 한계
- `limitations`
- 운영 또는 출시 상태
- 공개 가능한 evidence
- `print` 설정

본문은 구조화된 데이터가 아니라 자유로운 MDX다. 사례 성격에 맞춰 섹션을 선택한다.

- 운영 문제: 현상 → 가설 → 확인 → 개선 → 남은 실패 범위
- 신규 시스템: 기존 문제 → 제약 → 선택 → 구현 범위 → 출시 상태
- 성능: 병목 → 측정 환경 → 변경 → 재측정 → 트레이드오프
- AI 실험: 문제 → 실험 → 평가 → 채택·보류·폐기
- 회사 경력의 복수 사례: `CaseSection`
- 책임 분리: `RoleBoundary`
- 복구 범위: `FailureBoundary`
- 상태 전이: `StateFlow`
- 수치 요약: `MetricGrid`
- 실험 기록: `ExperimentRecord`
- 복잡한 흐름: Mermaid 코드 블록

회사 사례는 내부 구조를 재구성했다는 공개 범위 안내를 본문에 직접 넣어야 한다. `confidentialityNote`는 현재 자동 렌더링되지 않는다.

## Evidence 작성 원칙

Evidence에는 다음을 분리한다.

```yaml
facts:            # 확인된 사실과 출처
metrics:          # 값, 단위, 환경, 비교 기준, 출처
contribution:
  mine:
  team:
  external:
publication:
  allowed:
  anonymize:
  prohibited:
risks:            # 위험한 주장과 안전한 표현
```

수치는 본문에 먼저 쓰지 말고 evidence에 측정 환경과 적용 범위를 먼저 기록한다. 회사 업무와 이를 일반화한 개인 프로젝트의 결과를 섞지 않는다.

## 현재 자동화되지 않은 영역

문서에는 목표로 적혀 있지만 아직 구현되지 않았다.

- Article 컬렉션과 `/articles` 라우팅
- `relations.yaml`과 관련 콘텐츠
- 검색과 태그 페이지
- 전용 PDF 생성
- `print.include`, `detailLevel`에 따른 콘텐츠 선별
- 자동 링크 검사, Claim Audit 검사, 금지 표현 검사
- 접근성·모바일 시각 회귀 테스트
- 404, sitemap, robots
- GitHub Pages 배포 설정과 `base` 경로 처리

현재 PDF 지원은 브라우저 인쇄용 CSS뿐이다. `print` 필드 대부분은 아직 렌더링 제어에 사용되지 않는다.

또한 다음 필드는 스키마에는 있지만 화면 반영이 제한적이다.

- `datePrecision`
- 프로젝트 `operationStatus`
- `team`
- `links.demo`
- `confidentialityNote`

이 기능이 필요한 작업이라면 특정 콘텐츠에 하드코딩하지 말고 공통 레이아웃 또는 컴포넌트로 연결해야 한다.

## 검증 명령

```bash
npm run build
npm run dev
```

Node 요구 버전은 `>=22.12.0`이다.

빌드 시 Mermaid를 inline SVG로 변환하기 위해 headless Chrome을 실행한다. 제한된 샌드박스에서는 Chrome의 `setsockopt` 오류로 실패할 수 있지만, 권한이 허용된 환경에서 현재 빌드는 정상 통과하며 6개 정적 페이지가 생성된다.

현재 테스트·lint·링크 검사 스크립트는 없다. 작업 트리는 깨끗하며 이번 파악 과정에서 소스 파일은 수정하지 않았다.