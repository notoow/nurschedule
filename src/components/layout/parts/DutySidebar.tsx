"use client";

import React, { useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import {
    Users, Calendar, Settings, FileSpreadsheet,
    Share2, Download, LogOut, RotateCcw, RotateCw
} from 'lucide-react';
import { exportScheduleToExcel } from '@/lib/utils/excelExport';
import ShareModal from './ShareModal';
import FeedbackModal from './FeedbackModal';
import { useTranslation } from '@/hooks/useTranslation';

type MenuId = 'staff' | 'schedule' | 'config';

export default function DutySidebar() {
    const currentView = useScheduleStore(s => s.currentView);
    const setCurrentView = useScheduleStore(s => s.setCurrentView);
    const resources = useScheduleStore(s => s.resources);

    // History Actions
    const undo = useScheduleStore(s => s.undo);
    const redo = useScheduleStore(s => s.redo);
    const history = useScheduleStore(s => s.history);
    const future = useScheduleStore(s => s.future);

    const { t } = useTranslation();

    // Local Modals
    const [showShare, setShowShare] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const handleExport = () => {
        const state = useScheduleStore.getState();
        if (state.resources.length === 0) return;
        exportScheduleToExcel(
            state.resources,
            state.days,
            state.schedule,
            state.startDate
        );
    };

    const MenuItem = ({ id, label, icon: Icon }: { id: MenuId, label: string, icon: any }) => (
        <button
            onClick={() => setCurrentView(id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
                ${currentView === id
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
        >
            <div className={`p-2 rounded-lg transition-colors ${currentView === id ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white'}`}>
                <Icon size={18} className={currentView === id ? 'text-teal-600' : 'text-slate-400'} />
            </div>
            <div className="text-left">
                <span className={`block text-xs font-bold ${currentView === id ? 'text-slate-800' : 'text-slate-600'}`}>
                    {label}
                </span>
            </div>
            {currentView === id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-l-full" />
            )}
        </button>
    );

    return (
        <aside className="h-full flex flex-col bg-white border-r border-slate-100">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-800">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-lg">N</div>
                    <span className="font-extrabold tracking-tight text-lg">{t.sidebar.brand}</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 p-4 space-y-2">
                <div className="px-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.sidebar.mainMenu}</div>

                <MenuItem id="staff" label={t.sidebar.menu.staff} icon={Users} />
                <MenuItem id="config" label={t.sidebar.menu.config} icon={Settings} />
                <MenuItem id="schedule" label={t.sidebar.menu.roster} icon={Calendar} />
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-50 space-y-2">
                {/* Undo / Redo Group */}
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={undo}
                        disabled={history.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <RotateCcw size={16} />
                        <span className="text-xs font-bold">Undo</span>
                    </button>
                    <button
                        onClick={redo}
                        disabled={future.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <RotateCw size={16} />
                        <span className="text-xs font-bold">Redo</span>
                    </button>
                </div>

                <button
                    onClick={() => setShowShare(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                >
                    <Share2 size={18} />
                    <span className="text-xs font-bold">{t.common.share}</span>
                </button>
                <button
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                >
                    <Download size={18} />
                    <span className="text-xs font-bold">{t.common.export}</span>
                </button>

                {/* Feedback Button */}
                <button
                    onClick={() => setShowFeedback(true)}
                    className="w-full flex items-center gap-3 p-3 mt-4 rounded-xl text-indigo-500 hover:bg-indigo-50 transition-colors group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-indigo-50/50 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center gap-3 w-full">
                        {/* Custom SVG Icon for Feedback */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18" height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-indigo-500 group-hover:scale-110 transition-transform"
                        >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span className="text-xs font-bold text-indigo-600">Give Feedback</span>
                    </div>
                </button>
            </div>

            {/* Modals */}
            {showShare && <ShareModal onClose={() => setShowShare(false)} />}
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
        </aside>
    );
}
