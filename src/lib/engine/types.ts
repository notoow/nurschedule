export type SlotId = number;

export interface ShiftConfig {
    id: string; // 'D', 'E', 'N', 'O'
    name: string;
    shortName: string;
    color: string; // Text Color
    bgColor: string; // Background
    borderColor: string;
    isOff: boolean;
    workHour: number; // 8
}

export interface ResourceLevel {
    level: 1 | 2 | 3 | 4 | 5 | 6; // 6 is highest (Head)
    label: string;
}

export interface Resource {
    id: string;
    name: string;
    team: string; // 'A', 'B', 'Inactive'
    level: number; // 1-6

    // PDR 3.0 Advanced Limits
    targetNight: number;        // 목표 나이트 수 (AI Target)
    targetEvening: number;      // 목표 이브닝 수 (AI Target)
    minOff: number;             // 최소 휴무일 수

    // Special Status
    isPreceptor: boolean;       // 프리셉터 여부
    excludeFromCount?: boolean; // T.O. 카운트에서 제외 (깍두기)
    onTraining?: string;        // 프리셉티라면 프리셉터 ID
    isWeekdayDayOnly?: boolean; // ✨ NEW: 평일 데이 전담 (주말 Off)

    fixedShift?: string;        // 고정 근무 (ex: 'D' -> 데이 전담)
    forbiddenShifts: string[];  // 금지 근무 (ex: ['N'] -> 나이트 불가)

    // History
    prevShift?: string; // 지난달 마지막 근무 ('D', 'E', 'N', 'O'...)

    requests: Record<number, string>; // [dayIndex] -> 'D' (Wanted) or 'O' (Off)
}

// 3세대 엔진 최적화 모드
export type OptimizationMode = 'Balance' | 'NightAnswer' | 'Flexible';

// --- PDR 2.0 Constraint Types ---
export type PriorityLevel = 'Must' | 'High' | 'Medium' | 'Low';
export type ConstraintCategory = 'Pattern' | 'Resource' | 'TeamBalance' | 'Global';

export interface ConstraintConfig {
    constraintId: string;       // Unique Identifier (e.g. 'c1')
    displayName: string;        // UI Name
    description: string;        // Tooltip

    constraintCategory: ConstraintCategory;

    isEnabled: boolean;         // On/Off
    priorityLevel: PriorityLevel;
    penaltyWeight: number;      // Score penalty

    // Logic Params
    targetValue: number;        // e.g. 5 (days)
    args?: Record<string, any>;
}

export type ScheduleMatrix = Uint8Array;

export interface DailyRequirement {
    D: number;
    E: number;
    N: number;
}
