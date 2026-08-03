# WorkShield (Web Platform)

## 1. 기본 정보

- 프로젝트명: WorkShield (Web Platform)
- 단계 구분: SK Networks Family AI 캠프 4차 팀 프로젝트
- 형태: 3차 프로젝트에서 구현한 WorkShield MCP를 웹 사용자 흐름, API, LLM 설명 계층과 운영 인프라에 연결한 후속 프로젝트
- 팀 규모: 5명
- 저장소: https://github.com/SKNETWORKS-FAMILY-AICAMP/SKN30-4th-2Team
- 저장소에서 확인되는 개발 기간: 2026.07.22–2026.08.03
- 공식 교육 프로젝트 기간은 사용자 확인 전 `2026.07–2026.08` 수준으로만 사용한다.
- 제품 설명:
  - 사용자가 계약서를 업로드하고 계약 유형을 확인한다.
  - 3차 MCP의 조항 비교 결과를 웹에서 탐색한다.
  - 현재 계약서, 검토 결과와 연결된 법령 자료 범위 안에서 질의응답과 협의 문구를 제공한다.
  - 법률 자문, 위법·합법 판정과 계약 안전성 보장은 제공하지 않는다.

### 지원 범위

- 계약 유형:
  - SW 프리랜서 용역
  - SI 하도급
  - SM 하도급
- 문서 형식:
  - PDF
  - HWP
  - HWPX
  - DOCX
- 결과 성격:
  - 표준계약서 대비 검토 후보
  - 누락 가능성 체크리스트
  - 주의 문구 유사 신호
  - 관련 법령 참고자료
  - 검증된 근거 범위의 자연어 설명과 협의 문구

---

## 2. 3차 MCP와 4차 웹 플랫폼의 경계

### 3차 MCP가 담당하는 범위

- 문서 파싱과 조항 분리
- 계약 유형 지원 범위 판별
- Chroma·BM25 기반 검색과 재정렬
- `NONE`, `EXTRA`, `NO_MATCH`, `MISSING` 상태 생성
- 주의 문구 유사 신호
- 관련 법령 원문 조회

3차 MCP의 세부 품질 기준선과 RRF 점수 계약 오류는 `workshield-mcp.md` 내용을 유지한다.
4차 성과로 중복 계산하지 않는다.

### 4차 웹 플랫폼이 담당하는 범위

- 익명 업로드 세션과 임시 파일 수명주기
- 계약 유형 확인·선택과 검토 시작·취소·재시도 API
- 비동기 검토 상태와 진행률 저장·복구
- MCP 세션과 transport 조립
- 조항 결과, 누락 후보, 법령 근거의 사용자용 API 표현
- 검토 결과에 제한된 Chat과 Suggestions
- SSE 기반 검토·채팅 스트리밍
- React 웹 애플리케이션 연결
- AWS 인프라, 배포와 롤백 자동화

### 안전한 설명

- 3차의 결정론적 MCP를 4차에서 웹 서비스의 검색·검토 엔진으로 연결했다.
- MCP의 검색·분류 결과와 LLM의 설명·문구 생성을 API 계층에서 분리했다.

### 피해야 할 설명

- 4차에서 RAG·MCP 엔진을 처음부터 새로 개발했다.
- MCP, API, Web과 인프라 전체를 본인이 단독 구현했다.
- 법률 검토 전체를 AI로 자동화했다.

---

## 3. 본인 역할과 기여 범위

### 저장소와 PR로 확인되는 기여

GitHub 계정 `Hong1008`이 작성한 PR과 변경 내용을 기준으로 다음 범위를 본인 기여로 사용할 수 있다.

- 프로젝트 초기 구조와 MCP Git submodule 연결
- FastAPI API 초기 구성과 MCP Client·provider 추상화
- 공통 API 응답, 오류, 요청 ID, 안전한 로깅과 SQLite 영속성 기반 구성
- Review Aggregate의 상태 전이와 진행률 일관성
- 멱등 요청, 동시 상태 변경과 취소·재시도 충돌 처리
- OpenAPI의 멱등성·SSE·오류 응답 계약 정리
- LLM 위험 분석, Suggestions 출처 결합 ADR과 모델 검증 구조
- vLLM provider와 모델 비교·선정 평가
- Chat 질문 라우팅, 근거 제한, 분할 생성과 SSE 스트리밍
- AWS CDK 기반 인프라, GitHub Actions 배포·롤백과 권한 경계
- 운영 검증 체크리스트와 ADR 작성

### 대표 근거 PR

- #1: 프로젝트 구조와 MCP submodule
- #2: API 초기 설정, MCP 연결과 LLM provider 추상화
- #16: 공통 API·DB·로깅 기반
- #20: 백엔드 핵심 MVP 로컬 구현·검증 범위 정리
- #23: Review Aggregate 상태 머신과 진행률 일관성
- #24: 멱등성·SSE·오류 응답 OpenAPI 계약
- #27: 배포 자동화
- #31: LLM 위험 ADR와 Suggestions 출처 결합
- #34: vLLM provider와 평가 구조
- #37: 검토 진행 동기화, UI·오류 처리 통합
- #48: AWS IaC, CI/CD와 보안 경계
- #62·#63: 초기 LangGraph 질문 라우팅과 provider 분리
- #66: Chat SSE와 대화 의미 상태, 주의 신호 metadata 연결
- #68: 현행 결정적 Chat 라우팅 ADR와 MCP submodule 갱신

### 역할 표기 제한

- `백엔드·AI 서비스 아키텍처·인프라`는 저장소 근거가 있다.
- `PM`은 3차 프로젝트에서는 사용자 확인 사실이지만, 4차에서도 공식 PM이었는지는 문서만으로 확인되지 않는다.
- 4차 이력서에서 PM을 사용하려면 사용자가 직접 확인해야 한다.
- PR에 프런트엔드 변경이 포함되지만 주 역할을 `프론트엔드 개발`로 확대하지 않는다.
- 팀 전체 기능과 개인 구현을 구분한다. PR 하나에 upstream 병합이 포함될 수 있으므로 모든 변경 파일을 본인 단독 코드라고 표현하지 않는다.

---

## 4. 시스템 아키텍처

### 운영 요청 경로

```text
사용자 브라우저
  ↓ HTTPS
CloudFront
  ├─ 정적 Web → Private S3 + OAC
  └─ /api, /health → EC2 Nginx
                        ↓
                     FastAPI API
                     ├─ SQLite
                     ├─ WorkShield MCP container
                     └─ RunPod vLLM
                          
WorkShield MCP
  ├─ RunPod Embed/Rerank
  └─ 법령 조회 도구
```

### 실행 경계

- 로컬:
  - FastAPI lifespan이 MCP를 `stdio` 자식 프로세스로 실행한다.
  - API와 MCP가 파일시스템을 공유하므로 검증된 로컬 파일 경로를 전달한다.
- 운영:
  - API와 MCP는 EC2의 Docker Compose에서 실행한다.
  - API와 MCP는 `streamable HTTP`로 연결한다.
  - 컨테이너 사이에 로컬 파일 경로를 공유하지 않고 파일명과 base64 content를 전달한다.
- FastAPI lifespan은 MCP `ClientSession`을 유지하고 재사용한다.
- 시작 시 MCP capabilities handshake가 실패하면 readiness를 통과하지 않는다.

### API 기술 경계

- FastAPI Router: HTTP 입출력
- Application Service: 사용 사례와 트랜잭션
- Domain: 상태 전이와 규칙
- Repository: 저장
- Mapper: Domain과 SQLAlchemy Row 변환
- MCP·LLM 외부 호출 중에는 DB 트랜잭션을 열어두지 않는다.

### 주요 기술

- Frontend:
  - React 19
  - TypeScript
  - Vite
  - React Router
  - Tailwind CSS
  - React Markdown
- API:
  - Python 3.13
  - FastAPI
  - Pydantic
  - SQLAlchemy 2
  - SQLite
  - SSE
- LLM·MCP:
  - LangChain
  - MCP Adapter
  - FastMCP
  - vLLM
  - OpenAI-compatible provider abstraction
- Infrastructure:
  - AWS CDK
  - CloudFront
  - S3
  - EC2
  - EBS
  - Nginx
  - Docker Compose
  - SSM
  - Secrets Manager
  - CloudWatch
  - RunPod
- Quality:
  - Pytest
  - Ruff
  - Vitest
  - Testing Library
  - TypeScript typecheck
  - GitHub Actions

### 주의

- README 기술 스택에는 LangGraph가 포함돼 있으나 현행 Chat 처리 ADR은 LangGraph 기반 라우팅을 대체했다.
- `LangGraph 기반 챗봇을 운영했다`는 현재 구조 설명으로 사용하지 않는다.
- 초기 실험·구현 경험으로는 사용할 수 있으나 최종 구조와 구분한다.

---

## 5. Review 상태 머신과 진행률

### Review 상태

- `QUEUED`
- `REVIEWING`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `EXPIRED`

### 진행 단계

- `PREPARE`
- `BATCH_SEARCH`
- `RERANK`
- `CLAUSE_REVIEW`
- `MISSING_DETECTION`
- `RESULT_ASSEMBLY`

### 확인된 규칙

- 새 검토는 `QUEUED`와 0% progress로 생성된다.
- 실행 시작 시 `QUEUED → REVIEWING`으로 전이한다.
- MCP 상태가 `OK`인 결과만 `COMPLETED`로 확정한다.
- 진행 단계가 이전 단계로 되돌아가지 않도록 한다.
- 동일 단계의 current와 percent는 감소하지 않게 정규화한다.
- 완료 전 percent는 최대 99%, 완료 시 100%로 확정한다.
- progress마다 sequence를 증가시켜 오래된 이벤트를 구분한다.
- 서버 재시작으로 중단된 active review는 `REVIEW_INTERRUPTED`의 재시도 가능 실패로 전환할 수 있다.
- 취소는 반복 호출 가능한 멱등 전이로 처리하고 결과·오류를 제거한다.
- 만료 시 결과·오류·진행률 스냅샷을 제거한다.

### 동시성·멱등성 방어

- 요청의 `Idempotency-Key`와 요청 fingerprint로 같은 요청의 응답을 재생한다.
- 한 세션에 `QUEUED` 또는 `REVIEWING` 검토가 하나만 존재하도록 SQLite partial UNIQUE index를 사용한다.
- Review row의 version을 사용한 낙관적 잠금으로 동시 상태 변경 충돌을 감지한다.
- 취소와 실행 완료가 경쟁할 수 있으므로 현재 상태를 다시 읽고 충돌 시 제한된 횟수만 재시도한다.
- 파일 삭제는 DB 상태 변경과 같은 원자적 트랜잭션이 될 수 없으므로 DB commit 뒤 수행하고 반복 삭제가 가능하도록 한다.

### 안전한 결과 표현

- 검토 상태 전이를 Aggregate에 모으고, 단계·퍼센트가 역행하지 않는 progress 규칙을 구현했다.
- 멱등 키, 세션당 active review UNIQUE 제약과 낙관적 잠금을 서로 다른 중복·경쟁 방어로 사용했다.
- 서버 중단, 취소와 만료 시 남겨야 할 상태와 폐기할 민감 스냅샷을 구분했다.

### 피해야 할 표현

- 분산 큐를 구현했다.
- Exactly-once 검토 실행을 보장했다.
- 다중 API 서버에서도 안전하다.
- 서버 장애 후 작업이 중단 지점부터 자동 재개된다.

### 한계

- 파일형 SQLite와 프로세스 내부 실행 큐를 사용한다.
- API는 worker 1개를 유지해야 한다.
- 다중 인스턴스, 높은 동시 검토와 분산 작업 실행을 지원하는 구조가 아니다.
- 중단된 검토는 이어서 실행하는 것이 아니라 재시도 가능한 실패로 정리한다.

---

## 6. 익명 세션, 임시 파일과 개인정보 경계

### 접근 제어

- 로그인 없이 익명 세션을 사용한다.
- 세션 생성 시 충분한 엔트로피의 접근 토큰을 생성한다.
- 토큰 원문은 응답 body나 Web Storage에 넣지 않고 HttpOnly Cookie로 전달한다.
- DB에는 토큰 원문이 아니라 SHA-256 해시만 저장한다.
- 세션은 `session_id + token hash`, 검토는 `review_id + 상위 세션 token hash`로 소유권을 확인한다.
- 소유하지 않은 리소스와 존재하지 않는 리소스는 동일한 404로 처리한다.
- 소유권 확인 뒤 만료된 리소스는 410으로 처리한다.

### 세션 수명

최신 확정 요구사항을 기준으로 다음 표현을 사용한다.

- 세션은 생성 또는 검토 완료 후 30분간 유지한다.
- 일반 조회, 질문과 화면 이동으로 자동 연장하지 않는다.
- 사용자가 연장 버튼을 누르면 현재 시각 기준 30분으로 다시 설정한다.

초기 ADR의 `마지막 사용자 활동 기준 TTL 연장` 표현과 최신 요구사항이 다르므로, 이력서에서는 최신 요구사항만 사용한다.

### 파일 저장과 정리

- 사용자 파일은 `FileStorage` 경계로만 다룬다.
- 사용자 파일명을 실제 저장 경로로 사용하지 않는다.
- DB에는 실제 경로가 아니라 서버 생성 `storage_key`를 저장한다.
- 임시 파일 작성 뒤 atomic replace로 저장을 완료한다.
- 삭제는 이미 파일이 없어도 성공하는 멱등 연산이다.
- 경로 순회와 절대 경로 storage key를 차단한다.
- 세션 만료·폐기 시 파일과 민감 결과를 정리한다.
- 계약서와 대화 이력을 영구 저장하지 않는다.

### 로그 정책

- 기록 가능:
  - request ID
  - 세션 ID 해시
  - review ID
  - 상태
  - 처리 시간
- 기록하지 않음:
  - 계약서 원문
  - 조항 본문
  - 프롬프트
  - 검토 결과 본문
  - 대화 본문
  - Cookie·접근 토큰
  - API 키와 secret

### 제한

- 업로드 문서의 개인정보를 자동 마스킹하지 않는다.
- 사용자가 업로드 전에 불필요한 개인정보를 제거해야 한다.
- `개인정보 자동 제거`, `데이터가 외부로 전혀 나가지 않음`이라고 표현하지 않는다.
- RunPod를 사용하는 운영 구성에서는 검색·재정렬과 답변 생성을 위해 계약 조항과 후보 자료가 RunPod로 전달될 수 있다.

---

## 7. MCP 연결과 실패 경계

### 확인된 연결 구조

- MCP는 Git submodule로 부모 저장소에 연결한다.
- 로컬 기본 구성은 `stdio`, 운영 구성은 `streamable HTTP`다.
- API 시작 시 capabilities handshake로 필요한 도구 계약을 확인한다.
- 지속 세션을 재사용해 요청마다 MCP 프로세스와 연결을 새로 만들지 않는다.
- 문서 전달 방식은 transport에 따라 다르다.
  - local stdio: 검증된 `file_path`
  - streamable HTTP: `file_content`와 `file_name`

### 책임 경계

- API:
  - 세션·소유권
  - 상태 머신
  - 멱등성
  - 트랜잭션
  - 응답·오류 계약
  - LLM 오케스트레이션
- MCP:
  - 문서 파싱
  - 검색·재정렬
  - 상태 분류
  - 누락 탐색
  - 법령 조회

### 안전한 결과 표현

- 기존 MCP를 submodule로 유지하고 로컬·운영 transport에 맞춘 파일 전달과 세션 수명주기를 구현했다.
- API readiness가 MCP handshake 결과를 반영하도록 했다.

### 제한

- MCP 결과가 항상 성공한다고 가정하지 않는다.
- timeout, 네트워크 오류, `CORPUS_UNAVAILABLE`, 잘못된 설정과 파이프라인 실패를 구분한다.
- PR #20 시점에는 실제 배포된 streamable HTTP E2E와 장애 주입이 출시 전 검증 항목으로 남아 있었다.
- 이후 구현·문서가 추가됐지만, 최종 운영 E2E 완료 여부는 별도 확인 없이 단정하지 않는다.

---

## 8. Chat의 현행 라우팅, 근거와 스트리밍

### 현행 처리 구조

최종 Accepted ADR 기준으로 Chat은 LangGraph 그래프가 아니라 애플리케이션 서비스 파이프라인을 사용한다.

1. 완료된 Review와 `focus_clause_id`를 검증한다.
2. 서버가 확정할 수 있는 상태 의미, 목록, 주의 신호, 서비스 정책 질문을 결정적으로 처리한다.
3. 남은 질문은 이전 의미 상태, 명시적 비교 의도와 구조화 질문 분류기를 사용해 유형을 선택한다.
4. 질문 유형과 대상 조항으로 `AnswerPlan`을 만든다.
5. 필요한 경우에만 법령 원문을 추가한다.
6. 항목과 token 예산에 따라 계획을 나눠 Qwen 답변 모델을 순차 호출한다.
7. 모델 본문과 질문 유형·출처·제한·면책 metadata를 분리해 반환한다.

### 질문 대상 선택 우선순위

1. UI의 `focus_clause_id`
2. 질문에 명시된 조문 번호
3. 질문에 명시된 `EXTRA`, `NO_MATCH`, `MISSING` 결과군
4. 검증된 `conversation_token`의 직전 의미 대상
5. 전체 Review

일치하지 않는 조항을 앞쪽 조항으로 임의 대체하지 않는다.

### 외부 모델 전송 경계

- 서버가 결정적으로 처리하지 못한 질문 분류에 OpenAI를 사용할 수 있다.
- OpenAI 분류 호출에는 현재 사용자 질문만 전달하며 계약서 원문, 조항, 검토 결과와 대화 이력은 포함하지 않는다.
- 최종 답변과 Suggestions는 RunPod vLLM의 Qwen 모델이 생성한다.
- 운영 RunPod에는 답변·검색에 필요한 계약 조항과 후보 자료가 전달될 수 있다.
- `모든 계약 데이터가 외부 서비스로 전송되지 않는다`고 표현하지 않는다.

### 대화 상태

- 답변 원문 전체를 서버의 장기 대화 문맥으로 저장하지 않는다.
- 예측 불가능한 `conversation_token`에 다음 의미 상태만 임시 저장한다.
  - 직전 질문 유형
  - 대상 종류
  - 사용자 조항 ID 목록
  - 결과 상태 코드
  - `MISSING` 표준조항 ID
  - 다음 분할 답변 offset
- 이전 대화 원문은 답변 prompt의 근거로 사용하지 않는다.

### AnswerPlan과 분할

- 모델 호출당 출력 상한은 512 tokens다.
- 운영 model context에서 출력·template 여유를 제외한 prompt 상한을 관리한다.
- 한 묶음은 최대 3개 항목이다.
- 운영 vLLM 동시성 기준에 맞춰 묶음을 순차 생성한다.
- 단일 항목이 길면 문단 또는 3,000자 조각으로 나누며 원문을 조용히 버리지 않는다.

### SSE 이벤트

- `progress`
- `delta`
- `segment_complete`
- `completed`
- `failed`

중간 묶음 실패 시 이미 전달한 답변과 출처를 보존하고 continuation offset으로 남은 항목을 이어서 요청할 수 있다.

### 법령 grounding fallback

- 사용자 조항과 표준조항이 있으면 법령 조회 실패만으로 전체 답변을 거절하지 않는다.
- 법령 원문을 찾지 못한 경우 조항 설명은 제공하고 법령 참고자료를 확인하지 못했다는 제한을 표시한다.
- 특정 법령명·조문 원문을 직접 요구했는데 자료가 없으면 추측하지 않는다.

### 안전한 결과 표현

- LLM 호출 전에 질문 대상과 근거를 `AnswerPlan`으로 확정하고, 긴 결과를 조항 단위로 분할해 SSE로 전달했다.
- 이전 답변 원문 대신 검증된 의미 상태 token으로 후속 질문의 대상을 복원했다.
- 부분 실패 시 완료된 답변과 출처를 보존하고 남은 offset을 반환했다.

### 피해야 할 표현

- LangGraph가 현재 Chat 전체를 오케스트레이션한다.
- 장기 대화 메모리를 구현했다.
- 법률 질문이면 항상 법령 검색으로 정확한 답을 보장한다.
- 환각을 완전히 제거했다.

---

## 9. Suggestions 출처 결합과 LLM 안전장치

### 출처 책임 분리

초기 구조는 LLM이 실제 사용자 조항 ID, 표준조항 ID와 법령 source ID를 문자열로 복사하게 했다. 작은 모델이 유효한 문구를 생성하고도 ID 복사 실패로 차단되는 문제가 있어 책임을 변경했다.

LLM은 닫힌 집합의 근거 종류만 선택한다.

- `SRC_USER`
- `SRC_STANDARD`
- `SRC_GROUNDING`

백엔드는 현재 세션과 요청에서 검증한 실제 ID를 source key에 결정적으로 결합한다.

### 백엔드 hard gate

다음 출력을 사용자에게 반환하기 전에 차단한다.

- 내부 사용자·표준조항·grounding ID 노출
- 허용되지 않은 source key
- 원문과 확인 입력에 없는 금액·기간·비율
- 합법·위법·불법 등 법률 결론 단정
- 중국어·러시아어 문자 혼입
- JSON Schema·Pydantic 구조 위반

### repair 범위

- 최초 호출과 repair를 합쳐 최대 2회
- JSON·Pydantic·구조 오류는 1회 repair 가능
- 중국어·러시아어 혼입은 언어 repair 1회 가능
- 허용하지 않은 source key는 repair하지 않고 차단
- timeout과 길이 종료 결과를 이어 붙이지 않음

### 안전한 결과 표현

- 모델이 실제 출처 ID를 생성하지 않게 하고 근거 종류만 선택하도록 변경해, 출처 정확성을 백엔드 책임으로 분리했다.
- 구조화 출력 뒤 허위 수치, 법률 단정, 내부 ID와 허용되지 않은 출처를 결정론적으로 검사했다.

### 제한

- source key 선택 자체가 정확하다는 것을 보장하지 않는다.
- `SRC_GROUNDING`은 현재 항목 단위가 아니라 요청에서 조회한 grounding 종류 단위다.
- 반환 ID는 모델이 문자열을 직접 인용했다는 의미가 아니라 백엔드가 검증된 근거에 연결했다는 의미다.

---

## 10. 운영 LLM 모델 검증

### 비교 조건

- 동일한 8개 fixture를 각 2회 실행
- 범주:
  - 책임·손해배상
  - 대금·지급
  - 계약 해지
  - 지식재산권
  - 비밀유지
  - 업무 범위
  - 수치 grounding
  - 프롬프트 인젝션
- JSON Schema structured output
- thinking OFF
- temperature 0
- top_p 1
- seed 42
- 평가 concurrency 1
- 호출 timeout 60초
- MCP 결정론적 품질은 3차 MCP 평가를 재사용하고 API에서는 LLM 경계만 평가

### 선정 결과

운영 답변·Suggestions 모델로 `RedHatAI/Qwen3.5-9B-FP8-dynamic`을 선정했다.

- 16/16 최종 PASS
- 최초 출력의 중국어 혼입 2건을 repair
- hard gate 최종 실패 0
- latency p50: 7.102초
- latency p95: 16.416초
- completion token p50: 165
- completion token p95·최대: 255

후보 비교:

- Gemma 4 12B FP8 Dynamic: 12/16
- EXAONE 3.5 7.8B AWQ: 2/16
- 비양자화 EXAONE dry-run: 2건 모두 1,000 token length 종료

### 사용할 수 있는 표현

- 동일 fixture·schema·안전성 gate로 후보 모델을 비교하고 Qwen3.5 9B를 운영 후보로 선정했다.
- 호출별 token, finish reason, latency와 repair 여부를 artifact로 남겼다.

### 수치 해석 제한

- 16/16은 고정된 합성 fixture의 개발 검증 결과다.
- 법률 정확도나 실제 계약서 전체 품질이 아니다.
- 실패율 0%를 통계적으로 증명하지 않는다.
- 법률 전문가 타당성 평가는 수행하지 않았다.
- 콜드 스타트와 장시간 soak test를 측정하지 않았다.
- 모델 revision, tokenizer hash와 image digest는 당시 완전히 고정하지 못했다.

---

## 11. AWS 인프라와 배포 책임 경계

### 운영 구성

- 정적 Web: Private S3 + CloudFront OAC
- API·MCP: 단일 EC2의 Nginx + Docker Compose
- 임시 사용자 데이터: 암호화된 EBS
- 운영 접속: SSM Session Manager
- 모델:
  - RunPod vLLM Pod
  - RunPod Embed/Rerank Pod
- 비밀 관리:
  - Secrets Manager
  - SSM Parameter
- 로그:
  - CloudWatch

### 인프라 control plane

- AWS bootstrap, CDK deploy·destroy, RunPod와 runtime secret lifecycle은 로컬 운영 명령에서 수행한다.
- 모든 변경 명령은 다음 흐름을 따른다.

```text
preflight → lock → discover → plan → apply → verify → journal
```

- 결정적 이름과 tag로 기존 리소스를 재발견한다.
- 소유권이 불명확하거나 후보가 여러 개면 중단한다.
- immutable 설정이 다르면 명시적 교체 전까지 중단한다.
- 실패 보상은 이번 실행에서 만든 리소스에만 적용한다.

### GitHub Actions 권한 경계

- CI:
  - API lint·test
  - MCP test
  - Web typecheck·test·build
  - container build
  - Compose config 검증
  - infra test와 CDK synth
- 배포:
  - GitHub OIDC로 단기 AWS credential 사용
  - 기존 container image digest를 확인한 뒤 고정 SSM Document로 EC2에 배포
  - versioned Web artifact를 S3에 게시·승격
  - CloudFront invalidation
- 롤백:
  - 이미 검증된 artifact를 다시 활성화
  - 롤백 시 재빌드하지 않음

GitHub deploy role은 다음을 하지 않는다.

- CloudFormation 변경
- EC2·IAM 변경
- Secrets Manager 값 읽기
- RunPod 관리

### 안전한 결과 표현

- 인프라 생성·비밀·RunPod 수명주기와 애플리케이션 배포 권한을 분리했다.
- GitHub OIDC 배포 역할을 SSM 실행, S3 배포와 CloudFront invalidation 범위로 제한했다.
- container와 Web rollback이 기존 검증 artifact를 재사용하도록 구성했다.

### 제한

- 단일 EC2 구조다.
- ALB를 사용하지 않는다.
- 다중 instance, target health 자동 우회와 무중단 instance 교체를 지원하지 않는다.
- 고가용성, 무중단 배포와 자동 장애 복구로 표현하지 않는다.
- 실제 운영 비용 절감이나 배포 시간 개선 수치는 확인되지 않았다.

---

## 12. 테스트와 검증 범위

### 확인된 자동 검증

- API:
  - Pytest
  - Ruff
  - OpenAPI schema 동기화 테스트
- MCP:
  - Pytest
- Web:
  - TypeScript typecheck
  - Vitest·Testing Library
  - production build
- Infra:
  - Python helper test
  - AWS CDK synth
  - Docker Compose config 검증
- Container:
  - API image build
  - MCP image build
  - Embed/Rerank worker image build

### 테스트 수치 사용 제한

- 특정 시점 PR의 `77개 테스트 통과`처럼 변동 가능한 개수는 이력서에 사용하지 않는다.
- `전체 E2E 완료`, `장애 주입 검증 완료`는 최종 실행 기록을 별도로 확인한 뒤 사용한다.
- 자동 테스트 통과가 법률적 품질, 보안 완전성 또는 운영 안정성을 뜻하지 않는다.

---

## 13. 이력서에 사용할 수 있는 핵심 문장

### 프로젝트 요약 후보

- 3차에서 구현한 계약서 비교 MCP를 FastAPI·React 웹 서비스로 연결하고, 익명 세션·검토 상태·LLM 설명과 AWS 배포 경계를 설계했습니다.

### 기여 bullet 후보

- 3차 MCP를 Git submodule로 연결하고, 로컬 `stdio`와 운영 `streamable HTTP`에 따라 파일 경로·base64 전달을 분리한 MCP 세션 수명주기를 구현
- `QUEUED–REVIEWING–COMPLETED/FAILED/CANCELLED/EXPIRED` 상태 전이와 단조 progress를 Aggregate에 모으고, 멱등 키·세션당 active UNIQUE 제약·낙관적 잠금으로 중복 요청과 상태 경쟁을 구분해 처리
- LLM 호출 전 질문 대상과 근거를 `AnswerPlan`으로 확정하고, 의미 상태 token·조항 단위 분할·SSE continuation으로 긴 답변과 부분 실패를 처리
- Suggestions가 실제 출처 ID를 생성하지 않고 근거 종류만 선택하도록 변경하고, 백엔드에서 검증된 ID를 결합해 허위 수치·법률 단정·내부 ID를 hard gate로 차단
- 동일 fixture·JSON Schema·안전성 gate로 로컬 LLM 후보를 비교하고 Qwen3.5 9B를 선정했으며, latency·token·finish reason과 repair 여부를 평가 artifact로 기록
- AWS CDK와 GitHub Actions로 CloudFront·Private S3·EC2·SSM 배포를 구성하고, 고권한 인프라 lifecycle과 제한된 애플리케이션 배포 역할을 분리

### 짧은 기술 스택 후보

`Python, FastAPI, Pydantic, SQLAlchemy, SQLite, SSE, React, TypeScript, MCP, vLLM, AWS CDK, CloudFront, S3, EC2, SSM, Docker Compose, GitHub Actions`

---

## 14. 사용하면 안 되는 표현

- 법률 검토 자동화
- 위법 조항 판정
- 법률 정확도 100%
- 환각 완전 제거
- 민감정보가 외부로 전혀 전송되지 않음
- 개인정보 자동 마스킹
- Exactly-once 검토
- 분산 처리 시스템
- 대규모·실시간 트래픽 처리
- 다중 서버 고가용성
- 무중단 배포
- 자동 장애 복구
- AWS 비용 절감
- 배포 속도 개선
- 전체를 혼자 설계·구현
- LangGraph 기반 Chat이 현행 최종 구조라는 표현

---

## 15. 공개 범위

### 공개 가능

- 공개 GitHub 저장소와 PR
- 사용자 흐름과 시스템 구성
- Review 상태와 progress 단계
- 익명 세션·Cookie hash·storage key 설계
- MCP local·prod transport 차이
- LLM 출처 결합과 hard gate 정책
- 고정 fixture 모델 비교 결과와 측정 조건
- AWS 서비스 종류와 권한 경계
- 단일 EC2·SQLite 한계

### 공개하지 않음

- 실제 사용자 계약서
- 세션 Cookie와 접근 토큰
- 내부 secret·API key
- 실제 AWS account ID와 resource ID
- RunPod 관리 key
- 비공개 endpoint와 origin header
- 운영 로그 원문

---

## 16. 미확인 및 추가 확인 항목

- 4차 프로젝트의 공식 시작일과 종료일
- 4차에서도 공식 PM 역할이었는지
- 팀 내 공식 역할 분담표
- 실제 공개 운영 기간과 사용자 수
- 최종 streamable HTTP 전체 E2E·SSE 재연결·장애 주입 완료 기록
- 실제 배포와 롤백을 수행한 횟수
- 최종 운영 모델 image digest와 model revision
- 0731 Chat ADR 이후 실제 모델 평가 결과
- 장시간 계약서의 Review·Chat latency와 timeout 수치
- 공개 가능한 서비스 URL

확인 전에는 문서의 제한된 표현을 사용한다.

---

## 17. 주요 근거 경로

### 프로젝트·요구사항

- `README.md`
- `docs/requirements/요구사항.md`
- `docs/requirements/화면별_기능_정의서.md`

### API와 상태

- `api/README.md`
- `docs/api/backend-development-guide.md`
- `api/app/domains/reviews/domain.py`
- `api/app/domains/reviews/repository.py`
- `api/app/core/idempotency/`
- `docs/adr/0724-sqlite-persistence.md`
- `docs/adr/0724-anonymous-session-file-storage.md`
- `docs/adr/0724-minimal-operations.md`

### LLM

- `docs/adr/0727-suggestions-source-binding.md`
- `docs/adr/0728-vllm-model-validation-and-selection.md`
- `docs/adr/0730-langgraph-chat-prompt-routing.md` — superseded
- `docs/adr/0731-chat-deterministic-routing-answer-plan-streaming.md` — current
- `api/app/domains/chat/`
- `api/app/domains/suggestions/`
- `api/evaluation/llm/`

### 인프라

- `docs/architecture/infra/README.md`
- `docs/adr/0730-local-infrastructure-control-plane.md`
- `.github/workflows/`
- `infra/`
