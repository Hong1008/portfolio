# 전기차 충전 인프라 SOS 대시보드 (EV Charging SOS Dashboard)

## 1. 기본 정보

- 기간: 2026.04
- 형태: SK Networks Family AI 캠프 팀 프로젝트
- 팀 규모: 5명
- PM 여부는 사용자 확인 없이 사용하지 않는다.
- 본인 역할:
  - 백엔드·대시보드 구현
  - ERD 설계
  - 쿼리 작성
  - 데이터 적재
  - Streamlit 구현
- 저장소: https://github.com/SKNETWORKS-FAMILY-AICAMP/SKN30-1st-4Team
- 주요 기술:
  - Python
  - Pandas
  - Pandera
  - MySQL
  - Streamlit
  - Folium

### 확인된 구현

- 전기차 등록 대수와 충전기 수 기반 지역별 충전 불편지수 산출
- 17개 시·도 단위 분석
- 공공데이터 사용
- 지도와 차트 시각화
- MySQL ERD
- 데이터 적재 쿼리
- Pandera 스키마 검증
- `domain`, `web`, `config` 레이어 분리

### 안전한 메시지

- 공공데이터 수집·검증·적재·시각화의 전체 흐름을 구현했다.
- 데이터 처리와 화면 로직을 레이어로 분리했다.

### 한계

- 운영 데이터 파이프라인이 아님
- 주기적 자동 갱신·모니터링 구현 여부 확인 안 됨
- 불편지수는 팀이 정의한 분석 지표이며 공식 정책 지표가 아님
- 사용자 행동 또는 실제 충전 대기 시간을 직접 측정한 결과가 아님
