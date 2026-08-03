# KExcel

## 1. 기본 정보

- 프로젝트명: KExcel
- 설명: Kotlin DSL 기반 대용량 엑셀 생성 라이브러리
- 기간: 2026.05 한 달
- 형태: 개인 오픈소스 프로젝트
- 역할:
  - 설계
  - 구현
  - 테스트
  - 벤치마크
  - 공개
- 저장소: https://github.com/Hong1008/kexcel
- 공개 버전: JitPack `0.1.0`
- 라이선스: MIT
- 주요 기술:
  - Kotlin
  - Java 21
  - Gradle
  - Apache POI
  - FastExcel
  - JMH
  - GitHub Actions

### 프로젝트 경계

- 실무에서 경험한 엑셀 생성 성능과 복잡도 문제를 일반화한 개인 프로젝트다.
- KExcel의 모든 기능이 회사에서 구현됐던 것은 아니다.
- 회사 업무와 개인 프로젝트를 구분한다.

---

## 2. 확인된 설계

### 사용자 API

```kotlin
excel(output) {
    sheet("Simple Sheet") {
        row {
            cell(value = "Hello")
            cell(value = "KExcel")
        }
    }
}
```

### 주요 기능

- Kotlin DSL
- `ExcelDriver` 인터페이스
- Apache POI와 FastExcel 구현 분리
- DTO Binding
- Workbook → Sheet → Row → Cell 스타일 상속
- `Sequence` 기반 행 단위 스트리밍
- Native Extension
- 동일 시트 동시 쓰기 감지 및 Fail-Fast

### 아키텍처

```text
User Code
    ↓
WorkbookScope / SheetScope / DataSheetScope / RowScope
    ↓
ExcelDriver
  ↙           ↘
PoiDriver   FastExcelDriver
```

### 엔진 선택

- Classpath 자동 감지
- 명시적 Driver 지정 가능
- 사용자 프로젝트가 POI 또는 FastExcel 의존성을 직접 선택
- `kexcel-dsl`은 엔진에 compileOnly 의존

### 안전한 표현

- 동일한 DSL에서 POI와 FastExcel 구현을 선택할 수 있다.
- 엔진 종속 코드는 Driver 구현으로 분리했다.
- 스트리밍 제약과 동시 쓰기 오용을 Fail-Fast로 감지한다.

### 주의할 표현

- `Zero-allocation`
  - 안전한 표현: DSL 추가 할당량을 수백 바이트 수준으로 줄였다.
- `Thread Safety`
  - 안전한 표현: 동일 시트 동시 쓰기 감지 및 Fail-Fast
- 데이터 크기와 무관한 완전 일정 메모리
  - 안전한 표현: 512MB heap에서 100만 행 벤치마크를 수행했다.
- 어떤 환경에서도 일관되게 작동 보장
  - 엔진 기능 차이가 있으므로 단정하지 않는다.

---

## 3. 벤치마크

### 측정 환경

- JVM: OpenJDK 21, Adoptium
- Heap: 512MB
- GC: G1GC
- JMH: 1.36
- FastExcel: 0.18.4
- Apache POI: 5.2.5, SXSSF

README의 최신 의존 버전과 벤치마크 당시 버전은 다를 수 있다. 포트폴리오에는 `벤치마크 당시 버전`이라고 명시한다.

### DSL 오버헤드

조건:

- 10,000행 × 10열
- Native API와 DSL 처리량 비교

결과:

- FastExcel Native: 8.932 ops/s
- FastExcel DSL: 8.653 ops/s
- FastExcel DSL 오버헤드: 3.1%
- POI Native: 4.878 ops/s
- POI DSL: 4.856 ops/s
- POI DSL 오버헤드: 0.4%

### 핫패스 최적화

변경:

- inline 함수 적용
- 핫루프 내 `runCatching` 제거
- 반복 람다 생성 감소
- 수동 락 제어

결과:

- FastExcel DSL 오버헤드: 16.3% → 3.1%
- 실행당 DSL 추가 메모리 할당량: 약 200KB → 약 364B
- 추가 할당량 기준 약 99.8% 감소

주의:

- 전체 JVM 메모리 사용량 99.8% 감소가 아니다.
- DSL 추가 할당량의 감소다.
- `셀당 364B`로 표현하지 않는다.

### 대용량 처리

- 100,000행
  - FastExcel: 0.238초
  - POI SXSSF: 0.440초
- 1,000,000행
  - FastExcel: 3.396초
  - POI SXSSF: 4.249초

안전한 표현:

- 512MB heap의 벤치마크에서 100만 행 생성을 완료했다.
- 해당 환경에서 FastExcel이 POI SXSSF보다 빠르게 측정됐다.

피해야 할 표현:

- 모든 환경에서 100만 행 3초
- 메모리 사용량이 데이터 크기와 완전히 무관
- 운영 환경 성능

### 병합 성능

문제:

- POI `addMergedRegion`이 병합 추가마다 기존 영역과의 중복을 검사
- 병합 개수 증가 시 O(n²) 검증 비용

변경:

- `addMergedRegionUnsafe()` 사용

결과:

- 처리량: 3.36 → 17.42 ops/s
- GC 할당 속도: 1580.8 → 328.6 MB/s

한계:

- 중복 병합 검증을 우회하므로 잘못된 병합 요청을 사전에 방지할 전제가 필요
- 병합 메타데이터는 파일 작성 완료 시점까지 메모리에 유지
- CPU 병목은 줄었지만 memory residency는 남음

안전한 표현:

- POI 병합 검증 병목을 분석하고 Driver 구현에서 우회해 처리량을 개선했다.

피해야 할 표현:

- 전체 엑셀 생성 속도 518% 개선
- 안전성이 전혀 손상되지 않는 최적화
- OOM 완전 해결

---

## 4. 공개·근거

공개 가능:

- 저장소 코드
- README
- 벤치마크 문서
- 아키텍처
- JitPack 버전
- 제한과 트레이드오프

주요 근거 경로:

- `README.ko.md`
- `docs/BENCHMARK.ko.md`
- `kexcel-dsl/src/main/kotlin/...`
- GitHub Actions 설정
- JitPack release 정보
