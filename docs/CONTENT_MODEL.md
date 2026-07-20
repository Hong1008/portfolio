# CONTENT_MODEL.md

## 1. 목적

이 문서는 포트폴리오 사이트에서 경력, 프로젝트, 기술 글을 일관된 구조로 관리하기 위한 콘텐츠 모델을 정의한다.

목표는 다음과 같다.

- 새 경력이나 프로젝트를 추가해도 페이지 코드와 라우팅을 수정하지 않는다.
- 웹 상세 페이지와 PDF 요약본이 같은 사실 원본을 사용한다.
- 프로젝트 성격에 따라 필요한 서술 구조를 선택할 수 있다.
- 개인 기여, 팀 기여, 검증 결과와 한계를 명확하게 구분한다.
- 근거가 없는 주장과 과장된 표현을 콘텐츠 단계에서 차단한다.

---

## 2. 콘텐츠 유형

### 2.1 Experience

회사 또는 조직에서 수행한 업무를 기록한다.

- 조직, 팀, 운영 환경과 일정 제약을 포함한다.
- 하나의 회사 경력 아래 여러 사례를 포함할 수 있다.
- 실제 운영 여부와 출시 여부를 구분한다.
- 회사 내부 코드와 데이터는 공개하지 않는다.
- 개인 프로젝트에서 후속으로 구현한 결과를 회사 성과와 혼합하지 않는다.

### 2.2 Project

개인 또는 팀 프로젝트를 기록한다.

- 저장소, 실행 결과, 벤치마크와 회고를 연결할 수 있다.
- 본인과 팀의 기여 범위를 별도로 기록한다.
- 실험 결과와 실패한 시도를 공개 가능한 범위에서 상세히 설명한다.
- 현재 상태와 남은 한계를 포함한다.

### 2.3 Article

기술 글, 회고, 학습 기록을 연결한다.

- 포트폴리오 주장의 보조 근거로 사용한다.
- 원문 전체를 중복 저장하기보다 요약과 링크를 제공한다.
- 관련 경력 또는 프로젝트와 연결할 수 있다.

---

## 3. 파일 구조

```text
src/content/
├── experience/
│   └── [slug].mdx
├── projects/
│   └── [slug].mdx
└── articles/
    └── [slug].mdx

src/data/
├── evidence/
│   └── [slug].yaml
└── relations.yaml
```

콘텐츠 파일을 추가하면 다음 항목이 자동 갱신되어야 한다.

- 목록 페이지
- 상세 페이지
- 홈의 대표 콘텐츠
- 관련 콘텐츠
- 태그별 분류
- 사이트 검색
- PDF 포함 대상

---

## 4. 공통 Frontmatter

```yaml
---
title: string
slug: string
contentType: experience | project | article
summary: string

startDate: YYYY-MM
endDate: YYYY-MM | null
datePrecision: month | year
status: completed | ongoing | archived | cancelled | unpublished

organization:
  name: string | null
  displayName: string | null
  url: string | null

projectType:
  kind: company | personal | team | education | open-source | article
  operationStatus: production | pre-release | prototype | study | not-applicable

team:
  size: number | null
  composition:
    - role: string
      count: number
  note: string | null

role:
  title: string
  responsibilities:
    - string
  contributionSummary: string

technologies:
  primary:
    - string
  secondary:
    - string

themes:
  - reliability
  - idempotency
  - performance
  - architecture
  - infrastructure
  - data
  - ai-backend
  - search
  - experimentation
  - security
  - maintenance

featured: boolean
visibility: public | private-draft
confidentialityNote: string | null

links:
  repository: string | null
  demo: string | null
  retrospective: string | null
  article: string | null
  external:
    - label: string
      url: string

evidenceRef: string

print:
  include: boolean
  priority: number | null
  detailLevel: summary | standard | detailed
---
```

---

## 5. 필드 규칙

### title

- 외부 독자가 바로 이해할 수 있는 이름을 사용한다.
- 회사 내부 코드명만 단독으로 사용하지 않는다.
- 필요하면 서비스명 뒤에 기능을 설명한다.

### slug

- 영문 소문자와 하이픈만 사용한다.
- 공개 후에는 변경하지 않는다.

### summary

- 2~3문장 이내로 작성한다.
- 문제, 핵심 판단, 결과 또는 검증을 포함한다.
- 기술 스택만 나열하지 않는다.

권장 구조:

```text
[문제]를 해결하기 위해 [핵심 판단/구조]를 적용했다.
[본인 역할]을 담당했고, [검증 또는 구조적 결과]를 확인했다.
```

### status와 operationStatus

- `status`: 콘텐츠 또는 프로젝트의 현재 상태
- `operationStatus`: 실제 운영·출시 여부

### role

- `title`: 문서에 표시할 짧은 역할
- `responsibilities`: 직접 수행한 일
- `contributionSummary`: 팀 역할과 구분되는 한 문장 요약

`설계`, `리드`, `PM`, `구축`은 근거가 있을 때만 사용한다.

### technologies

- `primary`: 본문에서 실제 판단과 구현을 설명하는 핵심 기술
- `secondary`: 사용했지만 사례의 핵심은 아닌 기술

### themes

분류와 관련 콘텐츠 추천에 사용한다. 한 사례에만 필요한 태그는 추가하지 않는다.

### evidenceRef

`src/data/evidence/[evidenceRef].yaml` 파일을 가리킨다. 대표 콘텐츠는 근거 파일 없이 공개하지 않는다.

---

## 6. 본문 섹션 모델

```yaml
context:
problem:
constraints:
hypotheses:
alternatives:
decisions:
architecture:
implementation:
verification:
results:
limitations:
learnings:
```

모든 콘텐츠에 모든 섹션을 강제하지 않는다.

필수 조건:

- 모든 콘텐츠: `summary`, `role`, `context` 또는 `problem`, `results` 또는 `learnings`
- 대표 사례: `decisions`, `verification`, `limitations`
- 회사 경력: 운영·출시 상태, 개인과 팀 역할, 공개 범위

---

## 7. 사례 유형별 권장 구조

### 운영 문제

```text
배경 → 관찰한 현상 → 원인 가설 → 확인 방법 → 개선 → 재발 방지 → 처리하지 못한 범위
```

### 신규 시스템

```text
기존 문제 → 제약 조건 → 검토한 대안 → 구조 선택 → 구현 범위 → 완료 범위 → 출시 또는 운영 상태
```

### 성능 문제

```text
성능 현상 → 병목 가설 → 측정 환경 → 변경 → 재측정 → 트레이드오프 → 남은 한계
```

### AI·데이터 실험

```text
문제 정의 → 데이터 또는 모델 가설 → 실험 설계 → 평가 기준 → 결과 → 채택·보류·폐기 → 지표가 의미하지 않는 것
```

### 라이브러리

```text
사용자 문제 → API와 추상화 목표 → 핵심 인터페이스 → 안전 제약 → 성능·호환성 검증 → 공개 → 추상화의 한계
```

---

## 8. 재사용 가능한 컴포넌트

### ContentHeader

제목, 기간, 조직, 팀, 역할, 기술과 링크를 표시한다.

### SummaryCard

```yaml
problem:
decision:
role:
verification:
limitation:
```

### RoleBoundary

```yaml
mine:
  - string
team:
  - string
external:
  - string
```

### DecisionRecord

```yaml
situation:
options:
  - name:
    considered:
    note:
choice:
reason:
benefits:
tradeoffs:
```

실제로 검토하지 않은 선택지는 추가하지 않는다.

### ArchitectureDiagram

```yaml
type: flow | sequence | state | boundary
source: string
caption: string
```

### MetricComparison

```yaml
metric:
unit:
before:
after:
environment:
source:
```

### ExperimentRecord

```yaml
question:
hypothesis:
change:
dataset:
metric:
result:
decision: adopted | held | rejected
limitations:
```

### LimitationCallout

시스템이 책임지지 않는 범위를 표시한다.

### EvidenceLinks

저장소, 코드, 벤치마크, 회고와 실행 예시를 표시한다.

### ExpandableDetails

웹에서는 접고, 인쇄 시에는 `print.detailLevel`에 따라 포함한다.

---

## 9. 30초 요약 규칙

상세 페이지 상단에는 다음을 표시한다.

```yaml
problem:
decision:
role:
verification:
limitation:
```

각 항목은 최대 2문장으로 작성한다.

---

## 10. 검증 데이터 모델

```yaml
verification:
  methods:
    - type: benchmark
      name:
      environment:
      dataset:
      baseline:
      result:
      source:
    - type: regression-test
      name:
      cases:
      split:
      metric:
      result:
      source:
```

지원 유형:

- unit-test
- integration-test
- regression-test
- benchmark
- execution-trace
- log-analysis
- state-inspection
- reproduction
- manual-review
- user-confirmation

---

## 11. 수치 표현 규칙

```yaml
metric:
value:
unit:
scope:
environment:
baseline:
measuredAt:
source:
```

수치를 사용할 때 측정 대상, 환경, 데이터 규모, 비교 기준과 범위를 함께 기록한다.

금지:

- 측정 환경 없이 수치만 강조
- 재현 환경 수치를 운영 성과로 표현
- 전체 메모리와 추가 할당량 혼동
- 처리량 증가율을 전체 응답 시간 개선으로 표현

---

## 12. 결과 모델

```yaml
results:
  structural:
    - string
  operational:
    - string
  measured:
    - metricRef
  release:
    - string
```

- `structural`: 상태 분리, 책임 분리, 중복 구현 감소 등
- `operational`: 실제 운영에서 확인된 결과
- `measured`: 벤치마크와 평가 지표
- `release`: 공개, 배포, 기능 완료

---

## 13. 한계 모델

```yaml
limitations:
  responsibilityBoundary:
    - string
  technical:
    - string
  measurement:
    - string
  operational:
    - string
```

대표 사례에는 최소 하나의 한계를 기록한다.

---

## 14. 근거 데이터 모델

```yaml
contentSlug:
lastReviewedAt:

facts:
  - id:
    statement:
    sourceType: user-confirmed | repository | code | benchmark | resume | retrospective
    source:
    scope:
    public: true | false
    confidence: confirmed | partial | uncertain
    note:

metrics:
  - id:
    name:
    value:
    unit:
    environment:
    source:
    public: true | false

contribution:
  mine:
    - string
  team:
    - string
  external:
    - string

publication:
  allowed:
    - string
  anonymize:
    - string
  prohibited:
    - string

risks:
  - claim:
    reason:
    safeWording:
```

---

## 15. 관련 콘텐츠 모델

```yaml
relations:
  - from: source-slug
    to: target-slug
    type: generalized-into
    label: 실무 문제를 개인 라이브러리로 일반화
```

지원 관계:

- generalized-into
- follows-from
- explained-by
- benchmarked-by
- same-principle
- related-learning
- predecessor
- successor

---

## 16. PDF 노출 모델

```yaml
print:
  include: true
  priority: 10
  detailLevel: standard
  sections:
    context: true
    problem: true
    constraints: false
    decisions: true
    architecture: true
    implementation: false
    verification: true
    results: true
    limitations: true
```

PDF에서는 문제, 핵심 판단, 대표 구조, 검증 결과, 한계와 상세 웹 링크를 우선한다.

---

## 17. 상태와 공개 절차

```text
draft → fact-reviewed → claim-audited → public
```

공개 조건:

- 필수 메타데이터 존재
- 개인과 팀 기여 구분
- 운영·출시 상태 확인
- 수치 근거 연결
- 공개 범위 확인
- 한계 포함
- 링크 검사
- 웹·모바일·인쇄 검증
- Claim Audit 완료

---

## 18. 새 콘텐츠 추가 절차

1. 콘텐츠 유형을 선택한다.
2. evidence 파일에 확인된 사실을 먼저 기록한다.
3. 불확실한 정보와 공개 불가 내용을 분리한다.
4. 핵심 메시지 1~2개를 정한다.
5. 사례 유형에 맞는 구조를 선택한다.
6. 30초 요약을 작성한다.
7. 상세 본문을 작성한다.
8. 필요한 관계만 시각화한다.
9. Claim Audit을 수행한다.
10. PDF 노출 수준을 지정한다.
11. 빌드와 링크 검사를 수행한다.

새 콘텐츠를 추가하기 위해 라우팅, 홈 카드 배열, 상세 페이지 컴포넌트를 수정하면 안 된다.

---

## 19. 스키마 확장 원칙

스키마 확장 전 확인한다.

1. 선택적 본문 섹션으로 해결할 수 있는가?
2. 기존 범용 컴포넌트 옵션으로 해결할 수 있는가?
3. 두 개 이상의 콘텐츠에서 재사용 가능한가?
4. 기존 콘텐츠와 하위 호환되는가?
5. PDF 출력에도 의미가 있는가?

한 프로젝트만을 위한 전용 필드는 추가하지 않는다.

---

## 20. 완료 기준

- 30초 요약만 읽어도 문제와 역할을 알 수 있다.
- 개인과 팀의 기여가 구분된다.
- 기술 선택 또는 구조적 판단이 최소 하나 포함된다.
- 검증 방법이나 확인 가능한 결과가 포함된다.
- 대표 사례에는 한계가 포함된다.
- 수치에 출처와 범위가 있다.
- 공개 범위가 확인됐다.
- 관련 근거 링크가 동작한다.
- 모바일과 인쇄 화면에서 읽을 수 있다.
- Claim Audit을 통과했다.