"use client";
import React from "react";
import { useScheduleStore } from '@/store/useScheduleStore';

/**
 * ScoreBoard: Atomic Update Component
 * - generationCount, bestScore 등 초고속으로 변하는 상태만 구독하여 렌더링
 */
const ScoreBoard = () => {
    const generationCount = useScheduleStore(s => s.generationCount);
    const bestScore = useScheduleStore(s => s.bestScore);

    return (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
            <span>Gen: <strong>{generationCount.toLocaleString()}</strong></span>
            <span className="w-px h-3 bg-gray-300 mx-1"></span>
            <span>Score: <strong className={bestScore < 0 ? 'text-red-500' : 'text-blue-600'}>
                {bestScore === -Infinity ? '-' : bestScore.toLocaleString()}
            </strong></span>
        </div>
    );
};

export default React.memo(ScoreBoard);
