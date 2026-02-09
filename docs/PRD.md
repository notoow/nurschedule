# NurSchedule: 차세대 간호사 근무표 자동화 & API 솔루션 PRD

## 1. 프로젝트 비전 (Vision)
- **Product Identity**: "수간호사의 구원자" + "병원 HR 시스템의 핵심 엔진"
- **Mission**: 복잡한 제약 조건(Constraints)과 인적 요소(Human Factors)를 수학적으로 완벽하게 해결하여 의료 현장의 비효율을 제거한다.
- **Business Goal**: 초기에는 B2C(수간호사 개인용 도구)로 시작하여, 검증된 알고리즘을 API화(SaaS)하여 병원 그룹웨어 시장에 진출한다.

## 2. 핵심 아키텍처 (Architecture)
시스템은 확장성을 고려하여 **Multi-Tenant SaaS** 구조를 지향합니다.

### A. Entity Relationship
1. **Organization (조직)**
   - API Key 발급 및 과금의 주체 (예: OO대학병원 51병동).
   - 정책(Policy)과 구성원(Member)을 소유함.
2. **Member (구성원/간호사)**
   - **Properties**: `Level` (숙련도), `WorkloadScore` (업무 강도 누적치).
   - **Weights**: 개인별 가중치 (예: 임산부 = 나이트 근무 가중치 0).
3. **Policy (정책)**
   - 병동마다 다른 근무 규칙을 JSON 기반으로 정의.
   - 예: `{"constraints": [{"id": "NO_NIGHT", "target": "pregnant", "penalty": 99999}]}`

## 3. 기능 요구사항 (Detailed Features)

### A. 3세대 스케줄링 엔진 (The 3rd Gen Solver)
- **Weighted-Penalty System**: 단순히 "된다/안된다"가 아니라, 각 위반 사항에 정밀한 '비용(Cost)'을 부과하여 최적해를 찾음.
- **Constraint Injection**: 제약 조건을 코드 수정 없이 런타임에 주입 가능하도록 설계.
- **Smart Mutation**: 무작위 대입이 아닌, 벌점이 발생한 구간을 정밀 타격하여 수정하는 지능형 유전 알고리즘.

### B. 프리미엄 대시보드 (Frontend)
- **Tech**: Next.js 14, Canvas API (고성능 그리드), Glassmorphism UI.
- **Heatmap Visualization**: 
  - 특정 날짜의 인력 부족 강도 시각화.
  - 간호사별 피로도(Fatigue) 시각화.
- **Interactive Conflict Resolver**: 위반 사항 클릭 시 "왜 이 근무가 불가능한지" 설명 제공 및 대안 제시.

### C. 비즈니스 로직 (Monetization)
- **Credit System**: 1회 생성 시 `Credit` 차감 모델.
- **API Usage Tracking**: `Organization` 별 API 호출량, 생성된 근무표 수 통계 추적.

## 4. 제약 조건 명세 (Constraint Specifications)

### Hard Constraints (Breaking Rules - 절대 불가)
1. **Minimum Staffing**: 듀티별 최소 인원 충족.
2. **Skill Mix**: 각 근무조에 Charge(Level 1) 간호사 최소 1명 포함.
3. **Legal Rest**: 근무 간 최소 11시간 휴식 보장 (E-D 금지).
4. **Critical Patterns**: N-D, N-E 금지.

### Soft Constraints (Optimization Goals - 최소화 대상)
1. **Bio-Rhythm**: N-Off-D ("자는 오프") 방지.
2. **Fairness**: 
   - 주말 근무 횟수 표준편차 $\sigma < 0.5$ 목표.
   - 퐁당퐁당(D-N-D) 패턴 최소화.
3. **Continuity**: 5일 초과 연속 근무 시 가중치 벌점 부과 (일수^2).
4. **Member Request**: 개인 신청 근무 미반영 시 벌점 부과.

## 5. 데이터 흐름 (Data Flow)
1. **Input**: Nurse List + Policy Config + Requests -> **API Gateway**.
2. **Process**: 
   - **Validation**: 입력 데이터 무결성 검증.
   - **Engine**: Genetic Algorithm (Selection -> Smart Mutation -> Evaluation).
   - **Optimization**: 목표 점수 도달 시 조기 종료.
3. **Output**: Schedule Matrix + Violation Report -> **Client**.
