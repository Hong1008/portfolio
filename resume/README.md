# 이력서 관리

## 원본과 산출물

- `resume.yaml`: 이력서 전용 문장, 노출 순서와 evidence 참조
- `MARKET_REVIEW.md`: 채용 공고·ATS·공개 이력서 검토 기록
- `generated/`: 휴대전화를 제외한 저장소용 DOCX·PDF
- `private.example.yaml`: 제출용 연락처 로컬 설정 예시
- `private.local.yaml`: 실제 제출용 연락처. Git 제외
- `private-output/`: 연락처가 포함된 제출용 DOCX·PDF. Git 제외

이력서 문장은 새로운 사실 원본이 아니다. 경력과 프로젝트 주장은 `src/data/evidence`의 공개 가능하고 확인된 fact 또는 metric을 참조해야 한다.

## 문서 순서

1. 이름·직무·공개 연락처
2. 학력·교육·자격
3. 프로필과 핵심 기술
4. 경력 성과 요약
5. 회사 경력 상세
6. 소규모 프로젝트

회사 경력이 모두 끝나기 전에 개인·교육 프로젝트를 삽입하지 않는다. 프로젝트는 KExcel과 WorkShield 각각 두 문장으로 제한한다.

## 작성 규칙

- 결과와 본인 역할을 먼저 쓴다.
- 첫 페이지 요약과 상세 경력에 같은 문장을 반복하지 않는다.
- 팀 결과와 개인 기여를 구분한다.
- 측정 수치는 metric evidence와 측정 범위를 연결한다.
- 근거가 없는 대규모·무중단·고가용성·자동 복구 표현을 사용하지 않는다.
- 경력 공백과 개인 사정에 관한 설명을 추가하지 않는다.
- 사진, 생년월일, 주소, 성별, 희망연봉과 시험 원점수를 추가하지 않는다.

## 생성과 검증

```bash
npm run resume:build
npm run resume:verify
```

제출용 연락처가 필요한 경우 `private.example.yaml`을 `private.local.yaml`로 복사해 값을 입력하고 다음 명령을 실행한다.

```bash
npm run resume:submission
npm run resume:verify:submission
```

시장 검토일로부터 90일이 지났거나 지원 직무가 크게 달라지면 `MARKET_REVIEW.md`를 먼저 갱신한다.
