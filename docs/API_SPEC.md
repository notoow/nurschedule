# NurSchedule API Specification (v1)

이 문서는 NurSchedule 엔진의 핵심 기능인 `POST /generate` 엔드포인트의 입출력 규격을 정의합니다.
비즈니스 모델 확장을 고려하여 `Organization` 식별 및 `Policy` 주입 구조를 채택했습니다.

## 1. Endpoint Info
- **URL**: `POST /api/v1/generate`
- **Description**: 주어진 간호사 목록과 제약 조건 정책을 기반으로 최적의 근무표를 생성합니다.
- **Auth Header**: `x-api-key`: <Organization_API_Key>

## 2. Request Schema (JSON)

```json
{
  "meta": {
    "year": 2024,
    "month": 3,
    "startDate": "2024-03-01",
    "daysInMonth": 31,
    "holidays": [ "2024-03-01" ]  // 공휴일 처리용
  },
  "policy": {
    "constraintLevel": "STRICT",  // STRICT | BALANCED | FLEXIBLE
    "customRules": [
      {
        "id": "ERR_ED",
        "type": "HARD",
        "penalty": 10000,
        "enabled": true
      },
      {
        "id": "FAIRNESS_WEEKEND",
        "type": "SOFT",
        "penalty": 50,
        "enabled": true
      }
    ]
  },
  "nurses": [
    {
      "id": "nurse_001",
      "name": "박수간호사",
      "level": "CHARGE", // CHARGE | SENIOR | JUNIOR | NEW
      "contractType": "FULLTIME",
      "baseWeight": 1.0, // 기본 가중치
      "personalConstraints": {
        "maxContinuousWork": 5, // 개인별 체력 한계
        "avoidNight": false,    // 임신부 등 특수 상황
        "fixedOffDays": []      // 고정 휴무
      },
      "requests": [
        { "day": 5, "shift": "OFF", "priority": "HIGH" }, // 5일 휴무 신청
        { "day": 12, "shift": "DAY", "priority": "MEDIUM" }
      ],
      "history": {
        // 지난달 마지막 3일 근무 (연속 근무 및 패턴 계산용)
        "lastShifts": ["N", "OFF", "OFF"] 
      }
    }
    // ... 최대 100명
  ]
}
```

## 3. Response Schema (JSON)

성공 시 (Status 200):

```json
{
  "metadata": {
    "generatedAt": "2024-02-05T10:00:00Z",
    "executionTimeMs": 1450,
    "generationCount": 1500, // 유전 알고리즘 세대 수
    "bestScore": 9850 // 10000점 만점 기준
  },
  "schedule": {
    // [NurseID]: [Shift, Shift, Shift, ...] (31일치)
    "nurse_001": ["D", "D", "E", "E", "N", "N", "OFF", "OFF", ...],
    "nurse_002": ["OFF", "D", "D", "E", "E", "OFF", "N", "N", ...]
  },
  "analysis": {
    "violations": [
      {
        "nurseId": "nurse_005",
        "day": 15,
        "ruleId": "WARN_CONTINUOUS_5",
        "description": "6일 연속 근무 발생",
        "severity": "LOW"
      }
    ],
    "stats": {
      "avgWeekendWork": 2.4, // 평균 주말 근무 수
      "stdDevWeekend": 0.5,  // 주말 근무 표준편차 (낮을수록 공정)
      "chargeCoverage": 100  // 차지 간호사 커버리지 (%)
    }
  }
}
```

실패 시 (Status 4xx, 5xx):

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDIT",
    "message": "API 호출 한도를 초과했습니다. 플랜을 업그레이드하세요."
  }
}
```

## 4. Typescript Interface Definition

```typescript
export type ShiftType = 'D' | 'E' | 'N' | 'O';
export type NurseLevel = 'CHARGE' | 'SENIOR' | 'JUNIOR';

export interface GenerateRequest {
  meta: ScheduleMeta;
  policy: PolicyConfig;
  nurses: NurseInput[];
}

export interface NurseInput {
  id: string;
  name: string;
  level: NurseLevel;
  requests: RequestShift[];
  history: { lastShifts: ShiftType[] };
}

export interface GenerateResponse {
  schedule: Record<string, ShiftType[]>;
  analysis: ScheduleAnalysis;
}
```
