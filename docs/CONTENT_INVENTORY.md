# Content Inventory

2026-08-10 기준 공개 포트폴리오 콘텐츠 목록이다. 아래 9개 항목을 웹·인쇄·배포 검증의 기준으로 사용한다.

| 유형 | Slug | 기간 | 대표 순서 | Evidence | PDF | 운영·출시 상태 | 감사 상태 |
|---|---|---|---:|---:|---|---|---|
| 경력 | `shopl` | 2022.11–2023.08 | — | 완료 | 표준 | production | 검토 완료 |
| 경력 | `hunik` | 2021.09–2022.10 | — | 완료 | 표준 | pre-release | 검토 완료 |
| 경력 | `hodoolabs` | 2021.02–2021.08 | 1 | 완료 | 상세 | discontinued | 검토 완료 |
| 경력 | `g2e` | 2020.02–2021.02 | — | 완료 | 요약 | internal | 검토 완료 |
| 프로젝트 | `workshield-web` | 2026.07–2026.08 | 3 | 완료 | 상세 | pre-release | 검토 완료 |
| 프로젝트 | `workshield-mcp` | 2026.06–2026.07 | — | 완료 | 상세 | prototype | 검토 완료 |
| 프로젝트 | `kexcel` | 2026.05 | 2 | 완료 | 상세 | prototype | 검토 완료 |
| 프로젝트 | `movie-box-office` | 2026.05 | — | 완료 | 표준 | prototype | 검토 완료 |
| 프로젝트 | `ev-infrastructure` | 2026.04 | — | 완료 | 요약 | prototype | 검토 완료 |

## 교차 검토 결과

- 경력 기간은 `docs/SOURCE_OF_TRUTH.md`의 공통 프로필과 일치한다.
- 9개 공개 콘텐츠 모두 동일 slug의 evidence 파일과 연결된다.
- 모든 콘텐츠의 `evidenceHighlights`는 공개 fact 또는 metric ID만 참조한다.
- 대표 순서는 호두랩스 → KExcel → WorkShield Web이며 PDF 우선순위와 별도로 관리한다.
- 대표 사례와 추가 사례 모두 `caseSummary.limitation` 및 `limitations`를 포함한다.
- 샤플 보고서 생성과 KExcel의 구현·측정 결과를 서로 분리했다.
- 휴니크는 출시 전 종료 상태를 `pre-release`로 유지하고 운영 성과를 주장하지 않는다.
- WorkShield MCP의 평가 지표는 법률 정확도가 아닌 상태 분류 기준선으로 제한한다.
- WorkShield MCP 회고는 AI 생산성 주장이 아니라 실제 실행 기록·평가 가능성에 따른 범위 축소와 중단 판단의 근거로만 사용한다.
- WorkShield Web은 MCP의 검색·분류 성과를 중복 계산하지 않고 상태·외부 연동·배포 경계를 별도 사례로 다룬다.
- 영화 프로젝트는 내생성 해결이나 인과 추론으로 표현하지 않는다.
- 지투이의 권한 구현은 개인정보보호 체계 설계로 확대하지 않는다.

이 문서는 공개 콘텐츠가 변경될 때만 함께 갱신한다. 스키마와 evidence 참조 무결성은 Astro 빌드에서 검증한다.
