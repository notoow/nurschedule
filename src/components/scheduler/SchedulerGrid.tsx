"use client";

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { ScheduleMatrix, Resource } from '@/lib/engine/types';
import { interpolateRgb, parseColor } from '@/lib/utils/colors';
import { useScheduleStore } from '@/store/useScheduleStore';
import { UniversalValidator } from '@/lib/engine/validator';

interface SchedulerGridProps {
    nurses: string[]; // 간호사 ID 목록
    resources: Resource[]; // For Requests Access
    days: number;
    schedule: ScheduleMatrix; // Uint8Array [NurseIdx * Days + DayIdx]
    blameMatrix?: Float32Array; // 패널티 히트맵 데이터
    onCellClick?: (nurseIdx: number, day: number) => void;
    isRequestMode?: boolean;

    // ✨ Paint Mode Props
    isPaintMode?: boolean;
    paintBrush?: number;
    onPaint?: (rIdx: number, dIdx: number, val: number) => void;
}

const SHIFT_COLORS = ['#f3f4f6', '#10b981', '#3b82f6', '#ef4444']; // Off(0), Day(1), Eve(2), Night(3)
const ROW_HEIGHT = 40;
const COL_WIDTH = 30;

export default function SchedulerGrid({
    nurses, resources, days, schedule, blameMatrix, onCellClick, isRequestMode,
    isPaintMode, paintBrush, onPaint
}: SchedulerGridProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Engine Data for Tooltip Analysis
    const constraints = useScheduleStore(s => s.constraints);
    const startDate = useScheduleStore(s => s.startDate);

    // Handle Drag End Global
    useMemo(() => {
        if (typeof window !== 'undefined') {
            const handleUp = () => { isDragging.current = false; };
            window.addEventListener('mouseup', handleUp);
            return () => window.removeEventListener('mouseup', handleUp);
        }
    }, []);


    // Vertical Virtualization (Nurses)
    const rowVirtualizer = useVirtualizer({
        count: nurses.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    // Blame Heatmap Color Calculator
    const getBackgroundColor = (shiftCode: number, errorWeight: number) => {
        const baseColor = SHIFT_COLORS[shiftCode] || '#fff';
        if (!errorWeight || errorWeight <= 0) return baseColor;

        const intensity = Math.min(errorWeight / 1000, 0.8);
        return interpolateRgb(baseColor, '#ff0000', intensity);
    };

    // Tooltip Generator
    const getTooltip = (r: number, d: number, blame: number) => {
        if (!blame || blame <= 0) return undefined;
        // Analytical Tooltip
        const issues = UniversalValidator.analyzeCell(schedule, constraints, days, resources, startDate, r, d);
        if (issues.length === 0) return `Penalty: ${Math.round(blame)}`;
        return `${issues.join('\n')}\n(Score: -${Math.round(blame)})`;
    };

    const handleMouseDown = (r: number, d: number) => {
        if (isPaintMode && onPaint && paintBrush !== undefined) {
            isDragging.current = true;
            onPaint(r, d, paintBrush);
        } else {
            onCellClick?.(r, d);
        }
    };

    const handleMouseEnter = (r: number, d: number) => {
        if (isDragging.current && isPaintMode && onPaint && paintBrush !== undefined) {
            onPaint(r, d, paintBrush);
        }
    };

    return (
        <div
            ref={parentRef}
            className={`w-full flex-1 overflow-auto border rounded-xl shadow-inner bg-white relative select-none
                ${isPaintMode ? 'cursor-cell' : ''}
            `}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize() + 40}px`,
                    width: `${150 + days * COL_WIDTH}px`,
                    position: 'relative',
                }}
            >
                {/* Header Row (Sticky) */}
                <div className="sticky top-0 z-20 flex bg-slate-50 border-b border-slate-200 h-[40px] shadow-sm">
                    <div className="sticky left-0 w-[150px] bg-slate-100 z-30 flex items-center justify-center font-bold text-slate-500 text-xs border-r uppercase tracking-wider">
                        Date / Staff
                    </div>
                    {Array.from({ length: days }).map((_, d) => (
                        <div
                            key={d}
                            className="flex items-center justify-center border-r border-slate-200 text-[10px] font-bold text-slate-500 bg-slate-50"
                            style={{ width: `${COL_WIDTH}px` }}
                        >
                            {d + 1}
                        </div>
                    ))}
                </div>

                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const nurseIdx = virtualRow.index;
                    const nurseName = nurses[nurseIdx];
                    const offset = nurseIdx * days;
                    const res = resources[nurseIdx];

                    return (
                        <div
                            key={nurseIdx}
                            className="absolute top-0 left-0 w-full flex border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start + 40}px)`,
                            }}
                        >
                            {/* Name Column (Sticky Left) */}
                            <div className="sticky left-0 w-[150px] bg-white z-10 flex items-center px-4 font-semibold text-gray-700 border-r shadow-sm">
                                {nurseName}
                            </div>

                            {/* Day Cells */}
                            {Array.from({ length: days }).map((_, d) => {
                                const idx = offset + d;
                                const shift = schedule[idx];
                                const blame = blameMatrix ? blameMatrix[idx] : 0;

                                const reqShift = res.requests?.[d];
                                let bgColor = getBackgroundColor(shift, blame);
                                let textColor = shift === 0 ? '#9ca3af' : 'white';
                                let textContent = ['O', 'D', 'E', 'N'][shift];

                                // --- Request Mode Logic ---
                                if (isRequestMode) {
                                    if (reqShift === undefined) {
                                        bgColor = '#ffffff';
                                        textColor = '#cbd5e1'; // Light gray
                                        textContent = '';
                                    } else {
                                        const code = (reqShift === 'D') ? 1 : (reqShift === 'E') ? 2 : (reqShift === 'N') ? 3 : 0;
                                        bgColor = SHIFT_COLORS[code];
                                        textColor = code === 0 ? '#64748b' : 'white'; // Off is Slate-500
                                        textContent = reqShift;
                                    }
                                }

                                const tooltip = (!isRequestMode && !isPaintMode) ? getTooltip(nurseIdx, d, blame) : undefined;

                                return (
                                    <div
                                        key={d}
                                        onMouseDown={() => handleMouseDown(nurseIdx, d)}
                                        onMouseEnter={() => handleMouseEnter(nurseIdx, d)}
                                        className={`flex items-center justify-center text-xs font-bold relative border-r border-slate-50
                                            ${isRequestMode && reqShift === undefined ? 'hover:bg-slate-50' : ''}
                                            ${!isPaintMode && !isRequestMode ? 'cursor-pointer' : ''}
                                        `}
                                        style={{
                                            width: `${COL_WIDTH}px`,
                                            height: '100%',
                                            backgroundColor: bgColor,
                                            color: textColor,
                                        }}
                                        title={tooltip}
                                    >
                                        {textContent}

                                        {/* Request Indicator Badge (View Mode Only) */}
                                        {!isRequestMode && reqShift && (
                                            <div
                                                className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-white"
                                                style={{ backgroundColor: (reqShift === 'O') ? '#64748b' : '#6366f1' }} // Slate for Off Request, Indigo for Work Request
                                                title={`Requested: ${reqShift}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
