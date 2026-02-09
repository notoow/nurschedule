"use client";

import { useScheduleStore } from '@/store/useScheduleStore';
import { useWorkerEngine } from '@/hooks/useWorkerEngine';
import ScoreBoard from '@/components/layout/parts/ScoreBoard';
import MainGridContainer from '@/components/layout/parts/MainGridContainer';
import DutySidebar from '@/components/layout/parts/DutySidebar';
import StaffManagementView from '@/components/views/StaffManagementView';
import RosterConfigView from '@/components/views/RosterConfigView';
import { Play, Pause } from 'lucide-react';
import React, { memo } from 'react';

// Atomic Generate Button (Top Right)
const GenerateButton = memo(() => {
    const isGenerating = useScheduleStore(s => s.isGenerating);
    const setGenerating = useScheduleStore(s => s.setGenerating);
    // 현재 뷰가 'schedule'일 때만 생성 버튼이 의미가 있음 (UX)
    const currentView = useScheduleStore(s => s.currentView);

    if (currentView !== 'schedule') return null;

    return (
        <button
            onClick={() => setGenerating(!isGenerating)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${isGenerating ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-600 hover:bg-teal-700'
                }`}
        >
            {isGenerating ? <><Pause size={20} fill="white" /> AI 중지</> : <><Play size={20} fill="white" /> AI 근무표 생성</>}
        </button>
    );
});

const DateConfig = memo(() => {
    const startDate = useScheduleStore(s => s.startDate);
    const setStartDate = useScheduleStore(s => s.setStartDate);
    const days = useScheduleStore(s => s.days);
    const setDays = useScheduleStore(s => s.setDays);

    return (
        <div className="hidden md:flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm ml-4">
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            />
            <div className="w-px h-4 bg-slate-200" />
            <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer hover:text-teal-600 transition-colors"
            >
                <option value={28}>28 Days</option>
                <option value={29}>29 Days</option>
                <option value={30}>30 Days</option>
                <option value={31}>31 Days</option>
            </select>
        </div>
    );
});

export default function DashboardPage() {
    // 1. Worker Lifecycle Init
    useWorkerEngine();

    // 2. View Routing
    const currentView = useScheduleStore(s => s.currentView);
    const undo = useScheduleStore(s => s.undo);
    const redo = useScheduleStore(s => s.redo);

    // ✨ Global Keyboard Shortcuts (Undo/Redo)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return (
        <main className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">

            {/* Left Sidebar (Navigation) */}
            <div className="w-[260px] flex-shrink-0 z-30 shadow-xl">
                <DutySidebar />
            </div>

            {/* Main Workspace (Wide Area) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Global Header (Optional, or specific to view) */}
                {/* 여기서는 각 뷰가 헤더를 가질 수도 있지만, 전역 액션(Generate)은 상단에 두는 게 좋음 */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-2">
                        {/* Breadcrumbs or Title could go here */}
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {currentView === 'staff' && 'Step 1. Configure Staff'}
                            {currentView === 'config' && 'Step 2. Set Constraints'}
                            {currentView === 'schedule' && 'Step 3. AI Generation'}
                        </span>
                        <DateConfig />
                    </div>
                    <div className="flex items-center gap-4">
                        <ScoreBoard />
                        <GenerateButton />
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <div className="flex-1 overflow-hidden relative bg-slate-50">
                    {currentView === 'staff' && <StaffManagementView />}
                    {currentView === 'config' && <RosterConfigView />}
                    {currentView === 'schedule' && (
                        <div className="h-full p-6">
                            <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <MainGridContainer />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
