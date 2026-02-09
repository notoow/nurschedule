import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Resource, ScheduleMatrix, ConstraintConfig, OptimizationMode, ShiftConfig } from '@/lib/engine/types';
import { format } from 'date-fns';
import { UniversalValidator } from '@/lib/engine/validator';

// Snapshot Interface for Undo/Redo
interface StateSnapshot {
    schedule: Uint8Array;
    resources: Resource[];
    days: number;
    startDate: string;
}

// PDR 2.0에 맞게 State 확장
interface AppState {
    // Environment
    startDate: string; // YYYY-MM-DD
    days: number;

    // Core Data
    resources: Resource[];
    shiftTypes: ShiftConfig[]; // D/E/N/O 등 근무 타입 정의
    constraints: ConstraintConfig[]; // 사용자 정의 룰

    // Daily Requirements (T.O.)
    reqWeekday: { D: number, E: number, N: number };
    reqWeekend: { D: number, E: number, N: number };

    // State
    schedule: ScheduleMatrix;
    blameMatrix: Float32Array; // 위반 사항 히트맵

    // History for Undo/Redo
    history: StateSnapshot[];
    future: StateSnapshot[];

    // Engine State
    isGenerating: boolean;
    optimizationMode: OptimizationMode; // Balance | NightAnswer | Flexible
    generationCount: number;
    bestScore: number;

    // View Navigation (SSOT for UI State)
    currentView: 'staff' | 'config' | 'schedule';
    setCurrentView: (view: 'staff' | 'config' | 'schedule') => void;

    // Actions
    setStartDate: (date: string) => void;
    setDays: (days: number) => void;

    // Shift Management
    addShiftType: (config: ShiftConfig) => void;
    updateShiftType: (id: string, updates: Partial<ShiftConfig>) => void;

    // Resource Management
    setResources: (resources: Resource[]) => void;
    updateResource: (id: string, updates: Partial<Resource>) => void;
    generateSmartSeed: (count: number) => void;

    // Requirement Actions
    setRequirement: (type: 'weekday' | 'weekend', shift: 'D' | 'E' | 'N', value: number) => void;

    // Constraint Management
    updateConstraint: (id: string, updates: Partial<ConstraintConfig>) => void;

    // Bulk Management
    distributeTargets: (key: 'targetNight' | 'targetEvening' | 'minOff', value: number) => void;
    autoDistributeTargets: () => void;

    // Request Management (Wanted Duty)
    setResourceRequest: (resourceId: string, dayIndex: number, shiftId: string) => void;

    // Engine Control
    setOptimizationMode: (mode: OptimizationMode) => void;
    setGenerating: (isGenerating: boolean) => void;
    updateSchedule: (scheduleMap: Uint8Array, score: number, gen: number) => void;
    updateBlame: (blame: Float32Array) => void;
    toggleRequest: (resourceIndex: number, dayIndex: number) => void;

    // Manual & History
    manualOverride: (resourceIndex: number, dayIndex: number) => void;
    setScheduleValue: (resourceIndex: number, dayIndex: number, value: number) => void;
    undo: () => void;
    redo: () => void;
    syncPreceptees: () => void;
    clearNonNightShifts: () => void;

    // Helper Action
    saveSnapshot: () => void;
}

// Default Shifts (K-Standard)
const DEFAULT_SHIFTS: ShiftConfig[] = [
    { id: '1', name: 'Day', shortName: 'D', color: '#10B981', bgColor: '#ECFDF5', borderColor: '#A7F3D0', isOff: false, workHour: 8 },
    { id: '2', name: 'Evening', shortName: 'E', color: '#3B82F6', bgColor: '#EFF6FF', borderColor: '#BFDBFE', isOff: false, workHour: 8 },
    { id: '3', name: 'Night', shortName: 'N', color: '#F43F5E', bgColor: '#FFF1F2', borderColor: '#FECDD3', isOff: false, workHour: 8 },
    { id: '0', name: 'Off', shortName: 'O', color: '#94A3B8', bgColor: '#F8FAFC', borderColor: '#E2E8F0', isOff: true, workHour: 0 },
];

// Default Constraints (PDR 2.0 Schema)
const DEFAULT_CONSTRAINTS: ConstraintConfig[] = [
    { constraintId: 'c1', displayName: 'Max Consecutive Work', constraintCategory: 'Pattern', isEnabled: true, priorityLevel: 'High', penaltyWeight: 100, targetValue: 5, description: 'Limit maximum consecutive working days' },
    { constraintId: 'c2', displayName: 'Min Off Days', constraintCategory: 'Pattern', isEnabled: true, priorityLevel: 'High', penaltyWeight: 100, targetValue: 2, description: 'Minimum days off after consecutive work sequence' },
    { constraintId: 'c3', displayName: 'No NOD Pattern', constraintCategory: 'Pattern', isEnabled: true, priorityLevel: 'Must', penaltyWeight: 500, targetValue: 0, description: 'Prevent Night-Off-Day pattern (Health safety)' },
    { constraintId: 'c4', displayName: 'Max Night Shifts', constraintCategory: 'Resource', isEnabled: true, priorityLevel: 'Medium', penaltyWeight: 50, targetValue: 7, description: 'Limit maximum night shifts per month per nurse' },
    { constraintId: 'c5', displayName: 'E-D Gap (8hr Rule)', constraintCategory: 'Pattern', isEnabled: true, priorityLevel: 'Must', penaltyWeight: 500, targetValue: 0, description: 'Prevent Day shift immediately after Evening (Ensure 8h rest)' },
    { constraintId: 'c6', displayName: 'Skill Mix (Charge)', constraintCategory: 'Global', isEnabled: true, priorityLevel: 'Must', penaltyWeight: 1000, targetValue: 1, description: 'Ensure at least one skilled nurse (Lv 5+) per shift' },
    { constraintId: 'c7', displayName: 'Max Weekend Work', constraintCategory: 'Resource', isEnabled: true, priorityLevel: 'High', penaltyWeight: 100, targetValue: 4, description: 'Limit excessive weekend shifts for fairness' },
];

const generateRandomName = (idx: number) => {
    const kNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    const fNames = ['지우', '서준', '서연', '민준', '하은', '도윤', '지아', '예준', '수아', '시우'];
    return `${kNames[idx % 10]}${fNames[idx % 10]}${idx > 9 ? idx : ''}`;
};

export const useScheduleStore = create<AppState>()(
    immer((set, get) => ({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        days: 30, // 보통 1달

        resources: [],
        shiftTypes: DEFAULT_SHIFTS,
        constraints: DEFAULT_CONSTRAINTS,

        reqWeekday: { D: 3, E: 2, N: 2 },
        reqWeekend: { D: 2, E: 2, N: 2 },

        schedule: new Uint8Array(0),
        blameMatrix: new Float32Array(0),

        history: [],
        future: [],

        isGenerating: false,
        optimizationMode: 'Balance',
        generationCount: 0,
        bestScore: -Infinity,

        currentView: 'staff',
        setCurrentView: (view) => set((state) => { state.currentView = view; }),

        saveSnapshot: () => set((state) => {
            // Checkpoint: Current state pushed to history
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            if (state.history.length > 50) state.history.shift();
            state.future = []; // Clear redo stack on new action
        }),

        setStartDate: (date) => set((state) => {
            // Config Change -> Save Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];
            state.startDate = date;
        }),

        setDays: (days) => set((state) => {
            const oldDays = state.days;
            if (oldDays === days) return;

            // Config Change (Destructive) -> Save Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            const oldSchedule = state.schedule;
            state.days = days;

            const newSize = state.resources.length * days;
            const newSchedule = new Uint8Array(newSize);

            // Smart Resize: Preserve existing data (Row-by-Row copy)
            for (let r = 0; r < state.resources.length; r++) {
                const copyLen = Math.min(oldDays, days);
                const oldStart = r * oldDays;
                const newStart = r * days;
                for (let d = 0; d < copyLen; d++) {
                    newSchedule[newStart + d] = oldSchedule[oldStart + d];
                }
            }

            state.schedule = newSchedule;
            state.blameMatrix = new Float32Array(newSize); // Blame needs recalc, usually happens after action
        }),

        addShiftType: (config) => set((state) => { state.shiftTypes.push(config); }),
        updateShiftType: (id, updates) => set((state) => {
            const idx = state.shiftTypes.findIndex(s => s.id === id);
            if (idx !== -1) Object.assign(state.shiftTypes[idx], updates);
        }),

        updateConstraint: (id, updates) => set((state) => {
            const idx = state.constraints.findIndex(c => c.constraintId === id);
            if (idx !== -1) Object.assign(state.constraints[idx], updates);
        }),

        setResources: (res) => set((state) => {
            // Note: Full Replace usually doesn't need undo history unless manual
            state.resources = res;
            const size = res.length * state.days;
            state.schedule = new Uint8Array(size);
            state.blameMatrix = new Float32Array(size);
            state.history = []; // Reset history on new resource load
            state.future = [];
        }),

        updateResource: (id, updates) => set((state) => {
            // Save Snapshot BEFORE modifying
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            if (state.history.length > 50) state.history.shift();
            state.future = [];

            const idx = state.resources.findIndex(r => r.id === id);
            if (idx !== -1) Object.assign(state.resources[idx], updates);
        }),

        generateSmartSeed: (count) => set((state) => {
            state.resources = Array.from({ length: count }).map((_, i) => {
                const level = Math.floor(Math.random() * 6) + 1;
                return {
                    id: `RES-${i + 1}`,
                    name: generateRandomName(i),
                    level: level,
                    team: i % 2 === 0 ? 'A' : 'B',
                    targetNight: level === 6 ? 0 : 6,
                    targetEvening: level === 6 ? 0 : 6,
                    minOff: 8,
                    isPreceptor: level >= 5,
                    excludeFromCount: level <= 1,
                    forbiddenShifts: [],
                    fixedShift: level === 6 ? 'D' : undefined,
                    requests: {}
                };
            });

            const size = count * state.days;
            state.schedule = new Uint8Array(size);
            for (let k = 0; k < size; k++) {
                const r2 = Math.random();
                if (r2 < 0.25) state.schedule[k] = 1;
                else if (r2 < 0.5) state.schedule[k] = 2;
                else if (r2 < 0.75) state.schedule[k] = 3;
                else state.schedule[k] = 0;
            }
            state.blameMatrix = new Float32Array(size);
            state.history = [];
            state.future = [];
        }),

        setRequirement: (type, shift, value) => set((state) => {
            // Ops, also save history? Maybe later if needed.
            if (type === 'weekday') state.reqWeekday[shift] = value;
            else state.reqWeekend[shift] = value;
        }),

        distributeTargets: (key, value) => set((state) => {
            // Save Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            state.resources.forEach(r => {
                // Head Nurse Exception for Nights
                if (key === 'targetNight' && r.isWeekdayDayOnly) return;
                if (key === 'targetNight') r.targetNight = value;
                else if (key === 'targetEvening') r.targetEvening = value;
                else if (key === 'minOff') r.minOff = value;
            });
        }),

        autoDistributeTargets: () => set((state) => {
            // Save Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            let totalNights = 0;
            const start = new Date(state.startDate);
            let nWeekdays = 0;
            let nWeekends = 0;

            for (let i = 0; i < state.days; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const day = d.getDay();
                if (day === 0 || day === 6) nWeekends++;
                else nWeekdays++;
            }

            totalNights = (nWeekdays * state.reqWeekday.N) + (nWeekends * state.reqWeekend.N);
            const activeResources = state.resources.filter(r => !r.excludeFromCount && !r.isWeekdayDayOnly);

            if (activeResources.length === 0) return;

            const base = Math.floor(totalNights / activeResources.length);
            let remainder = totalNights % activeResources.length;

            state.resources.forEach(r => {
                if (r.excludeFromCount || r.isWeekdayDayOnly) {
                    if (r.isWeekdayDayOnly) r.targetNight = 0;
                } else {
                    let val = base;
                    if (remainder > 0) {
                        val += 1;
                        remainder--;
                    }
                    r.targetNight = val;
                }
            });
        }),

        setResourceRequest: (rId, dIdx, shiftId) => set((state) => {
            // Request changes are also resource changes
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            const r = state.resources.find(res => res.id === rId);
            if (r) {
                if (!r.requests) r.requests = {};
                r.requests[dIdx] = shiftId;
            }
        }),

        setOptimizationMode: (mode) => set((state) => { state.optimizationMode = mode; }),
        setGenerating: (val) => set((state) => { state.isGenerating = val; }),

        updateSchedule: (newSch, score, gen) => set((state) => {
            // Optimization updates - usually we don't snapshot every gen, but for manual stop?
            // Actually, the generator calls this rapidly. Only meaningful updates or final result needed?
            // Let's rely on manual snapshot or final result.
            // For "Run Engine", we might want 1 undo step for the whole run.

            // Note: If we snapshot every updateSchedule call, memory explodes.
            // Assuming this is called by engine.
            // We should only snapshot Manually or when engine FINISHES (not implemented here yet).
            // For now, let's NOT snapshot here to avoid lag. 
            // The USER action "Generate" should snapshot before running.

            state.schedule = new Uint8Array(newSch);
            state.generationCount = gen;
            state.bestScore = score;
        }),

        updateBlame: (blame) => set((state) => {
            state.blameMatrix = blame;
        }),

        toggleRequest: (rIdx, dIdx) => set((state) => {
            // Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            const res = state.resources[rIdx];
            if (!res) return;
            if (!res.requests) res.requests = {};

            const current = res.requests[dIdx];
            // Cycle: undefined -> 'O' -> 'D' -> 'E' -> 'N' -> undefined
            if (current === undefined) res.requests[dIdx] = 'O';
            else if (current === 'O') res.requests[dIdx] = 'D';
            else if (current === 'D') res.requests[dIdx] = 'E';
            else if (current === 'E') res.requests[dIdx] = 'N';
            else delete res.requests[dIdx];
        }),

        manualOverride: (rIdx, dIdx) => set((state) => {
            // Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            const idx = rIdx * state.days + dIdx;
            const current = state.schedule[idx];
            // Cycle: 0(Off) -> 1(Day) -> 2(Eve) -> 3(Night) -> 0
            const next = current >= 3 ? 0 : current + 1;
            state.schedule[idx] = next;

            // Real-time Re-evaluation
            state.blameMatrix.fill(0);
            const newScore = UniversalValidator.evaluate(
                state.schedule,
                state.constraints,
                state.days,
                state.resources,
                state.startDate,
                state.reqWeekday,
                state.reqWeekend,
                state.blameMatrix
            );
            state.bestScore = newScore;
        }),

        // ✨ Smart Paint Action
        setScheduleValue: (rIdx, dIdx, value) => set((state) => {
            const idx = rIdx * state.days + dIdx;
            if (state.schedule[idx] === value) return; // No change

            // Snapshot (Optimized: If last snapshot was very recent/same type, maybe merge? For now, simplistic)
            // To avoid flooding history during drag, we might need a debounce or 'transaction' concept.
            // But for now, let's just push history.

            // *Better UX*: Only push history if it's a NEW stroke.
            // But state doesn't track strokes. Let's just push.
            // It might fill up history fast, but we increased limit to 50.

            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            state.schedule[idx] = value;

            // Real-time Re-evaluation (can be heavy on paint, but validator is fast)
            // If laggy, we can debounce evaluation.
            UniversalValidator.evaluate(
                state.schedule,
                state.constraints,
                state.days,
                state.resources,
                state.startDate,
                state.reqWeekday,
                state.reqWeekend,
                state.blameMatrix
            );
        }),

        undo: () => set((state) => {
            if (state.history.length === 0) return;
            const prev = state.history.pop();
            if (prev) {
                // Save Current to Future
                state.future.push({
                    schedule: new Uint8Array(state.schedule),
                    resources: JSON.parse(JSON.stringify(state.resources)),
                    days: state.days,
                    startDate: state.startDate
                });

                // Restore Previous
                state.schedule = prev.schedule;
                state.resources = prev.resources;
                state.days = prev.days;
                state.startDate = prev.startDate;

                // Re-evaluate (BlameMatrix size might change!)
                const newSize = state.resources.length * state.days;
                if (state.blameMatrix.length !== newSize) {
                    state.blameMatrix = new Float32Array(newSize);
                } else {
                    state.blameMatrix.fill(0);
                }

                state.bestScore = UniversalValidator.evaluate(
                    state.schedule, state.constraints, state.days, state.resources, state.startDate, state.reqWeekday, state.reqWeekend, state.blameMatrix
                );
            }
        }),

        redo: () => set((state) => {
            if (state.future.length === 0) return;
            const next = state.future.pop();
            if (next) {
                // Save Current to History
                state.history.push({
                    schedule: new Uint8Array(state.schedule),
                    resources: JSON.parse(JSON.stringify(state.resources)),
                    days: state.days,
                    startDate: state.startDate
                });

                // Restore Future
                state.schedule = next.schedule;
                state.resources = next.resources;
                state.days = next.days;
                state.startDate = next.startDate;

                // Re-evaluate
                const newSize = state.resources.length * state.days;
                if (state.blameMatrix.length !== newSize) {
                    state.blameMatrix = new Float32Array(newSize);
                } else {
                    state.blameMatrix.fill(0);
                }

                state.bestScore = UniversalValidator.evaluate(
                    state.schedule, state.constraints, state.days, state.resources, state.startDate, state.reqWeekday, state.reqWeekend, state.blameMatrix
                );
            }
        }),

        // ✨ Extended Features for DutyMaker Parity
        syncPreceptees: () => set((state) => {
            let changed = false;
            // Snapshot logic executed inside if changed
            // Actually, better to calculate changes first.

            // Temporary buffers
            const newSch = new Uint8Array(state.schedule);

            state.resources.forEach((res, idx) => {
                if (res.onTraining) {
                    const preceptor = state.resources.find(p => p.id === res.onTraining);
                    if (preceptor) {
                        const pIdx = state.resources.indexOf(preceptor);
                        if (pIdx !== -1) {
                            // Copy Schedule Row
                            const start = idx * state.days;
                            const pStart = pIdx * state.days;
                            for (let d = 0; d < state.days; d++) {
                                // Check if changed
                                if (newSch[start + d] !== newSch[pStart + d]) {
                                    newSch[start + d] = newSch[pStart + d];
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            });

            if (changed) {
                // Push Snapshot
                state.history.push({
                    schedule: new Uint8Array(state.schedule), // Original
                    resources: JSON.parse(JSON.stringify(state.resources)),
                    days: state.days,
                    startDate: state.startDate
                });
                state.future = [];

                // Apply
                state.schedule = newSch;

                // Re-evaluate
                state.blameMatrix.fill(0);
                UniversalValidator.evaluate(
                    state.schedule, state.constraints, state.days, state.resources, state.startDate, state.reqWeekday, state.reqWeekend, state.blameMatrix
                );
            }
        }),

        clearNonNightShifts: () => set((state) => {
            // Snapshot
            state.history.push({
                schedule: new Uint8Array(state.schedule),
                resources: JSON.parse(JSON.stringify(state.resources)),
                days: state.days,
                startDate: state.startDate
            });
            state.future = [];

            for (let i = 0; i < state.schedule.length; i++) {
                if (state.schedule[i] === 1 || state.schedule[i] === 2) {
                    state.schedule[i] = 0; // Turn D/E into Off
                }
            }
            state.blameMatrix.fill(0); // Reset blame
        }),
    }))
);
