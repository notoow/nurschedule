"use client";

import React, { memo, useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Settings, Download, Users, RefreshCw, FileUp, Share2, UserCog } from 'lucide-react';
import { exportScheduleToExcel } from '@/lib/utils/excelExport';
import ExcelImportModal from '@/components/layout/parts/ExcelImportModal';
import ShareModal from '@/components/layout/parts/ShareModal';
import StaffListModal from '@/components/layout/parts/StaffListModal'; // Added

const ExportButton = memo(() => {
    const handleExport = () => {
        const state = useScheduleStore.getState();
        const { resources, days, schedule, startDate } = state;
        if (resources.length === 0) return;
        exportScheduleToExcel(resources, days, schedule, startDate);
    };

    return (
        <button onClick={handleExport} className="flex items-center justify-center gap-2 w-full py-3 mt-auto border-2 border-slate-100 rounded-xl text-slate-500 font-bold hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all active:scale-95">
            <Download size={16} /> Export to Excel
        </button>
    );
});

const ShareButton = () => {
    const [isModalOpen, setModalOpen] = useState(false);
    const resourceCount = useScheduleStore(s => s.resources.length);

    return (
        <>
            <button
                onClick={() => {
                    if (resourceCount === 0) {
                        alert("공유할 근무표 데이터가 없습니다.");
                        return;
                    }
                    setModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 border-2 border-teal-100 text-teal-700 rounded-xl hover:bg-teal-100 hover:border-teal-300 transition-all font-bold text-xs"
            >
                <Share2 size={16} />
                <span>Share & Print QR</span>
            </button>

            {isModalOpen && <ShareModal onClose={() => setModalOpen(false)} />}
        </>
    );
};

// New: Staff Management Button
const StaffManageButton = () => {
    const [isModalOpen, setModalOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-xs shadow-sm"
            >
                <UserCog size={16} className="text-slate-400" />
                <span>Manage Staff List</span>
            </button>
            {isModalOpen && <StaffListModal onClose={() => setModalOpen(false)} />}
        </>
    );
};


const ImportButton = () => {
    const [isModalOpen, setModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-dashed border-slate-200 text-slate-600 rounded-xl hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/10 transition-all group"
            >
                <FileUp size={18} className="text-slate-400 group-hover:text-teal-600 group-hover:-translate-y-1 transition-transform" />
                <span className="font-bold text-xs">Import Excel Roster</span>
            </button>

            {isModalOpen && <ExcelImportModal onClose={() => setModalOpen(false)} />}
        </>
    );
};

const ConfigPanel = () => {
    const days = useScheduleStore(s => s.days);
    const resourceCount = useScheduleStore(s => s.resources.length);
    const setDays = useScheduleStore(s => s.setDays);
    const generateSmartSeed = useScheduleStore(s => s.generateSmartSeed);

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="text-slate-400" size={18} />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment Config</h2>
            </div>

            <div className="space-y-6">
                {/* Days Control */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 block mb-2">SCHEDULING PERIOD</label>
                    <div className="flex items-center gap-2">
                        <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                        <span className="text-xs font-bold text-slate-400">Days</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <ImportButton />
                    <StaffManageButton /> {/* Added */}
                </div>

                {/* Resource Control (Smart Seed) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 block mb-2">TEAM BUILDING</label>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-slate-800">{resourceCount}</span>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">Agents</span>
                    </div>

                    <button onClick={() => generateSmartSeed(30)} className="w-full mb-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <Users size={14} /> Create 30 Staff (Demo)
                    </button>

                    <button onClick={() => generateSmartSeed(100)} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                        <RefreshCw size={14} /> 100 Staff Stress Test
                    </button>
                </div>

                <ShareButton />
                <ExportButton />
            </div>
        </div>
    );
};

export default memo(ConfigPanel);
