"use client";
import React from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import SchedulerGrid from '@/components/scheduler/SchedulerGrid';
import WelcomeOverlay from './WelcomeOverlay';
import { GraduationCap, Moon } from 'lucide-react';

/**
 * MainGridContainer
 * - schedule과 blameMatrix, resources만 구독하여,
 * - 헤더나 사이드바가 리렌더링되어도 그리드에는 영향이 없도록 격리
 * - 데이터가 없으면 WelcomeOverlay 표시
 */
const MainGridContainer = () => {
    const resources = useScheduleStore(s => s.resources);
    const days = useScheduleStore(s => s.days);
    const schedule = useScheduleStore(s => s.schedule);
    const blameMatrix = useScheduleStore(s => s.blameMatrix);
    const toggleRequest = useScheduleStore(s => s.toggleRequest);
    const manualOverride = useScheduleStore(s => s.manualOverride);
    const setScheduleValue = useScheduleStore(s => s.setScheduleValue); // ✨

    // DutyMaker Special Actions
    const syncPreceptees = useScheduleStore(s => s.syncPreceptees);
    const clearNonNightShifts = useScheduleStore(s => s.clearNonNightShifts);

    // UI State for Editing Requests
    const [isRequestMode, setRequestMode] = React.useState(false);

    // ✨ Smart Paint State
    const [isPaintMode, setPaintMode] = React.useState(false);
    const [paintBrush, setPaintBrush] = React.useState<number>(1); // Default Day

    // Grid에 넘겨줄 이름 배열 캐싱 (불필요한 prop 변경 방지)
    const nurseNames = React.useMemo(() => resources.map(r => r.name), [resources]);

    const handleCellClick = React.useCallback((nurseIdx: number, day: number) => {
        if (isRequestMode) {
            toggleRequest(nurseIdx, day);
        } else if (isPaintMode) {
            // Click apply paint
            setScheduleValue(nurseIdx, day, paintBrush);
        } else {
            manualOverride(nurseIdx, day);
        }
    }, [isRequestMode, isPaintMode, paintBrush, toggleRequest, setScheduleValue, manualOverride]);

    // ✨ 데이터가 없으면 온보딩 화면 표시
    if (resources.length === 0) {
        return <WelcomeOverlay />;
    }

    // Brush Config
    const BRUSHES = [
        { val: 1, label: 'D', color: 'bg-emerald-500 text-white' },
        { val: 2, label: 'E', color: 'bg-blue-500 text-white' },
        { val: 3, label: 'N', color: 'bg-rose-500 text-white' },
        { val: 0, label: 'O', color: 'bg-slate-400 text-white' },
    ];

    return (
        <div className="relative h-full w-full flex flex-col">
            {/* Grid Toolbar */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mr-4">
                        {isRequestMode ? (
                            <span className="text-indigo-600 animate-pulse">● Editing Requests</span>
                        ) : isPaintMode ? (
                            <span className="text-emerald-600 font-black flex items-center gap-1">
                                🖌️ Painting:
                                {BRUSHES.find(b => b.val === paintBrush)?.label}
                            </span>
                        ) : (
                            <span>● Result View</span>
                        )}
                    </div>

                    {/* Paint Palette - Only Visible in Paint Mode */}
                    {isPaintMode && !isRequestMode && (
                        <div className="flex items-center gap-1 mr-4 bg-slate-100 p-1 rounded-lg animate-in fade-in zoom-in duration-200">
                            {BRUSHES.map(b => (
                                <button
                                    key={b.val}
                                    onClick={() => setPaintBrush(b.val)}
                                    className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-all
                                        ${paintBrush === b.val ? b.color + ' shadow-md scale-110' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Special Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={clearNonNightShifts}
                            className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-all flex items-center gap-1"
                            title="Clear Day/Eve to focus on Night distribution"
                        >
                            <Moon size={12} /> Night Only
                        </button>
                        <button
                            onClick={syncPreceptees}
                            className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200 transition-all flex items-center gap-1"
                            title="Copy Preceptor schedule to Preceptees"
                        >
                            <GraduationCap size={12} /> Sync Preceptee
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setRequestMode(false); setPaintMode(false); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${(!isRequestMode && !isPaintMode) ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        View
                    </button>
                    <button
                        onClick={() => { setRequestMode(false); setPaintMode(true); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${(isPaintMode && !isRequestMode) ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Smart Paint Mode"
                    >
                        🖌️ Paint
                    </button>
                    <button
                        onClick={() => { setRequestMode(true); setPaintMode(false); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${isRequestMode ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        ✏️ Requests
                    </button>
                </div>
            </div>

            <SchedulerGrid
                nurses={nurseNames}
                resources={resources}
                days={days}
                schedule={schedule}
                blameMatrix={blameMatrix}
                onCellClick={handleCellClick}
                isRequestMode={isRequestMode}
                // ✨ Smart Paint Props
                isPaintMode={isPaintMode}
                paintBrush={paintBrush}
                onPaint={setScheduleValue}
            />
        </div>
    );
};

export default React.memo(MainGridContainer);
