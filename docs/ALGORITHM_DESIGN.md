# Weighted-Penalty Genetic Algorithm Design (Advanced)

이 문서는 단순 패턴 매칭을 넘어, **확장 가능하고(Constraint Objects)** **고성능인(Smart Mutation)** 3세대 스케줄링 엔진의 설계를 다룹니다.

## 1. Core Concept: Constraint Object Pattern
제약 조건을 하드코딩하지 않고 객체로 추상화하여, 런타임에 유연하게 적용합니다.

### Type Definition
```typescript
interface Constraint {
    id: string;        // 규칙 식별자 (예: 'NO_E_TO_D')
    name: string;      // 표시 이름
    type: 'HARD' | 'SOFT';
    penalty: number;   // 위반 시 부여할 점수
    target?: NurseSelector; // 특정 그룹(임산부 등)에만 적용 가능
    
    // 검증 함수: 전체 스케줄 또는 특정 간호사의 스케줄을 받아 위반 점수 반환
    evaluate: (schedule: Schedule, nurseIdx: number, dayIdx: number) => number;
}
```

## 2. Advanced Constraints Logic

### A. Pattern Matching (Sliding Window)
3일치 근무(`Today`, `Tomorrow`, `AfterTomorrow`)를 슬라이딩 윈도우로 스캔하여 패턴을 감지합니다.

- **Death Pattern (Hard)**:
  - `E` -> `D`: Shift Interval < 8 hours. (Penalty: 10,000)
  - `N` -> `D` | `E`: Sleep deprivation. (Penalty: 10,000)

- **Bad Quality Pattern (Soft)**:
  - `N` -> `Off` -> `D`: "Sleeping Off". (Penalty: 500)
  - `N` -> `N` -> `N` -> `N`: 4 consecutive nights. (Penalty: 300)

### B. Global Fairness (Statistics)
스케줄 전체를 집계하여 분산을 계산합니다.
- **Weekend Distribution**: 모든 간호사의 (토+일) 근무 횟수를 배열로 만들고 표준편차(Standard Deviation)를 구합니다.
  - `Cost = StdDev * Weight`

## 3. Optimization Strategy: Smart Mutation
랜덤 변이는 느립니다. "문제가 있는 곳"을 집중적으로 고칩니다.

### Algorithm Flow
1. **Initial Population**: 휴리스틱을 사용하여 "어느 정도 말이 되는" 초기 해 100개 생성.
2. **Evaluation with Blame Tracking**:
    - 스케줄을 순회하며 페널티 계산.
    - 동시에 **`BlameMatrix[Nurse][Day]`** 에 벌점 누적. (어디가 문제인지 히트맵핑)
3. **Selection**: 엘리트 보존 (상위 5%).
4. **Smart Mutation**:
    - 랜덤하게 좌표를 찍는 것이 아니라, `BlameMatrix` 값이 높은(문제가 많은) 좌표를 확률적으로 더 많이 선택.
    - 선택된 좌표의 근무를 변경하여 국지적 최적화(Local Optimization) 시도.
    ```typescript
    function mutate(schedule: Schedule, blameMatrix: number[][]) {
        const targetNurse = weightedRandomSelect(blameMatrix.rowWeights);
        const targetDay = weightedRandomSelect(blameMatrix.colWeights[targetNurse]);
        schedule[targetNurse][targetDay] = getRandomShift();
    }
    ```

## 4. Performance Tuning
- **Bitwise Operations**: 근무 형태(D/E/N/O)를 정수가 아닌 비트마스크로 처리하여 연산 속도 향상 고려.
- **Web Worker Offloading**: 메인 스레드 블로킹 방지.
- **Memoization**: 변경되지 않은 간호사의 스코어는 캐싱하여 재사용.

## 5. 데이터 구조 (Engine Spec)

### Genome (Schedule)
```typescript
type ShiftCode = 0 | 1 | 2 | 3; // 0:Off, 1:Day, 2:Eve, 3:Night
type Genome = Uint8Array; // Flat Array for performance: [Nurse1Day1, Nurse1Day2, ..., Nurse2Day1, ...]
```
자바스크립트 객체 배열 오버헤드를 줄이기 위해 `TypedArray` 사용을 권장합니다.
