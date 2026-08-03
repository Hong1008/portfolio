# SOURCE_OF_TRUTH.md

## 1. 개요 및 목적

이 문서는 포트폴리오 콘텐츠 작성에 사용하는 사실 원본(Single Source of Truth)의 메인 진입점 문서다.

기존 단일 파일로 관리되던 거대 문서(1,400여 줄)를 보동성, 가독성, Git Diff 관리를 높이기 위해 `docs/source_of_truth/` 하위의 전문 문서로 모듈화하여 관리한다.

다음을 분리해 관리한다:
- 사용자가 직접 확인한 사실
- 공개 저장소와 문서로 확인한 사실
- 사용할 수 있는 수치와 측정 범위
- 개인과 팀의 기여 범위
- 공개 가능한 내용 및 위험 표현 가이드

잘 다듬어진 소개 문구보다 사실 정확성을 우선한다.

---

## 2. 문서 목차 및 구조

사실 원본 문서는 아래의 분류에 따라 체계적으로 분리되어 관리된다.

### 2.1 공통 프로필 및 서술 가이드
- **[공통 프로필 (Profile)](file:///home/hong/project/my/portfolio/docs/source_of_truth/profile.md)**
  - 기본 인적사항, 경력 기간, 포트폴리오 핵심 메시지 후보
  - AI 캠프 대외활동 및 학습 범위
  - 학력 및 자격증
  - 개인 및 프로젝트 관련 주요 링크
- **[서술 규칙 및 가이드라인 (Writing Rules)](file:///home/hong/project/my/portfolio/docs/source_of_truth/writing-rules.md)**
  - 사용하기 좋은 관점 및 권장 대체 표현
  - 금지 또는 고위험 표현 목록
  - 미확인 및 추후 확인 항목
  - 사실 원본 갱신 규칙

### 2.2 경력 (Experiences)
각 경력별 사실 원본 문서는 포트폴리오 Slug와 1:1로 대응된다.

- **[샤플앤컴퍼니 (`shopl`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/experiences/shopl.md)**: 온보딩 메일 발송 시스템 (SES/SQS 2단 멱등성), 점검 보고서 생성 개선 (FastExcel/Kotlin DSL), 현장 이슈 관리
- **[휴니크 (`hunik`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/experiences/hunik.md)**: 젤로텍 v2 신규 개발 (책임 분리 도메인 모델링), AWS VPC/ECS Fargate/Jenkins CI/CD 인프라 구축
- **[호두랩스 (`hodoolabs`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/experiences/hodoolabs.md)**: 땅콩스쿨 통합 결제 API (PG/인앱, 미완료 주문 복구 배치, DB UNIQUE 제약 중복 방어), 호두잉글리쉬 결제 리팩터링
- **[지투이 (`g2e`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/experiences/g2e.md)**: 통합응급의료정보망 Flutter 키오스크 앱 및 백엔드 CRUD API, 연명의료정보포탈 메뉴별 세부 권한 처리

### 2.3 프로젝트 (Projects)
각 프로젝트별 사실 원본 문서는 포트폴리오 Slug와 1:1로 대응된다.

- **[KExcel (`kexcel`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/projects/kexcel.md)**: Kotlin DSL 대용량 엑셀 라이브러리 (POI/FastExcel Driver 분리, 핫패스 최적화, JMH 벤치마크, Fail-Fast)
- **[WorkShield (`workshield`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/projects/workshield.md)**: 계약서 분석 MCP 서버 (결정론적 1차 MCP / 2차 LLM 분리, RRF 점수 계약 오류 교정, Trace 기반 평가 구조)
- **[영화 흥행 예측 및 배급 시뮬레이터 (`movie-box-office`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/projects/movie-box-office.md)**: 2-Stage 흥행 예측 모델 (CatBoost/XGBoost 앙상블, 단조 증가 제약 배급 효과 분리)
- **[전기차 충전 인프라 SOS 대시보드 (`ev-infrastructure`)](file:///home/hong/project/my/portfolio/docs/source_of_truth/projects/ev-infrastructure.md)**: 공공데이터 기반 17개 시·도 충전 불편지수 대시보드 (Pandera 데이터 검증)

---

## 3. 갱신 규칙

새로운 경력, 프로젝트가 추가되거나 기존 사실관계/벤치마크/수치/공개범위가 변경될 경우 `docs/source_of_truth/` 하위 해당 전문 문서 및 `writing-rules.md`를 갱신한다.
