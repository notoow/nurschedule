# System Architecture & Tech Stack (2026 Standard)

이 문서는 "나중에 뜯어고칠 일 없는" 최신 표준 기술 스택과 아키텍처를 정의합니다.

## 1. Frontend Architecture: "Reactive & Performant"
대규모 데이터(70명 x 30일)를 60fps로 렌더링하고 관리하기 위한 스택입니다.

- **State Management**: `Zustand` + `Immer`
  - Redux의 보일러플레이트를 제거하고, Immutable Update를 쉽게 처리.
  - `useScheduleStore`를 통해 전역 상태(근무표) 관리.
- **UI Engine**: 
  - **Grid**: `TanStack Table v8` (Headless UI). 직접`<table>` 태그를 쓰지 않고, 가상화(Virtualization)와 정렬 로직만 사용.
  - **Styling**: `Vanilla CSS Modules` (User Request) + `clsx` (Conditional Class).
  - **Icons**: `Lucide React`.
- **Worker Communication**: `Comlink`
  - Web Worker와의 통신을 `RPC` 스타일로 추상화하여, 복잡한 `postMessage` 핸들링 제거.

## 2. Algorithm Engine: "Blame-Weighted Annealing"
단순 유전 알고리즘에 '시뮬레이티드 어닐링(담금질 기법)'을 결합하여 수렴 속도를 극대화합니다.

### A. Dynamic Mutation Rate (Adaptive)
```typescript
// 초기에는 높은 확률로 탐색(Exploration), 후반에는 낮은 확률로 착취(Exploitation)
const currentTemp = INITIAL_TEMP * Math.pow(COOLING_RATE, generation);
const mutationRate = BASE_MUTATION_RATE + (currentTemp / INITIAL_TEMP) * 0.5;
```

### B. Bitwise Check (Performance)
근무 형태를 정수형 상수로 정의하고, 비트 연산으로 패턴 매칭 속도 최적화.
```typescript
const SHIFT = { OFF: 0, DAY: 1, EVE: 2, NIGHT: 3 };
// 예: N(3) -> D(1) 체크 = (prev << 2 | curr) === (3 << 2 | 1) = 13 (binary 1101)
```

## 3. Data Model: "SaaS Ready"
확장성을 고려한 JSON Schema 기반 정책 주입.

### Policy Schema (Example)
```json
{
  "orgId": "hospital_A_51",
  "config": {
    "allowOvertime": false,
    "maxConsecutiveDays": 5
  },
  "constraints": [
    {
      "id": "MANDATORY_OFF_AFTER_NIGHT",
      "type": "HARD",
      "penalty": 10000,
      "params": { "minHours": 24 }
    }
  ]
}
```

## 4. Performance Optimization (Pre-optimization)
- **Virtualization**: `TanStack Virtual`을 사용하여 화면에 보이는 셀만 렌더링.
- **Memoization**: `Reselect` 패턴을 `Zustand` 내에서 사용하여 불필요한 리렌더링 방지.
- **Bitmasking**: 70명의 스케줄 상태를 `Uint8Array`로 관리하여 메모리 점유율 최소화.
