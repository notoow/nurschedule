"use client";

import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, PlayCircle } from 'lucide-react';
import { cleanAndParseExcel, ImportResult } from '@/lib/utils/excelImport';
import { useScheduleStore } from '@/store/useScheduleStore';
import StaffListModal from './StaffListModal';

export default function WelcomeOverlay() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showStaffList, setShowStaffList] = useState(false);

    const generateSmartSeed = useScheduleStore(s => s.generateSmartSeed);

    // Store 직접 접근 (Selector Loop 방지)
    const handleManualSetResources = (data: ImportResult) => {
        useScheduleStore.setState((state) => {
            const { resources, meta, schedule } = data;

            // 1. Metadata Restore
            if (meta) {
                state.startDate = meta.startDate;
                state.days = meta.days;
            }

            // 2. Resources Restore
            state.resources = resources;

            // 3. Schedule Restore
            const currentDays = meta ? meta.days : state.days;
            const size = resources.length * currentDays;

            if (schedule && schedule.length === size) {
                state.schedule = schedule;
            } else {
                state.schedule = new Uint8Array(size);
            }

            state.blameMatrix = new Float32Array(size);
            state.history = [];
            state.future = [];
        });
    };

    const handleDemoClick = () => {
        // 1. 15명 데이터 생성 (Store에 주입)
        generateSmartSeed(15);
        // 2. 바로 그리드로 가는 게 아니라, Staff List를 먼저 띄움
        setShowStaffList(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const data = await cleanAndParseExcel(e.target.files[0]);
                handleManualSetResources(data);
                // 엑셀도 마찬가지로 Staff List 확인 유도
                setShowStaffList(true);
            } catch (err) {
                alert("Error parsing file.");
            }
        }
    };

    return (
        <>
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">

                <div className="mb-12 text-center">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">NurSchedule AI</h1>
                    <p className="text-xl text-slate-500 font-medium">Automated Roster Engine v1.0</p>
                </div>

                <div className="flex gap-4 w-full max-w-2xl">
                    {/* Option A: Excel Upload */}
                    <div
                        className="flex-1 bg-slate-900 text-white rounded-xl p-8 cursor-pointer hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-4 group active:scale-95"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FileSpreadsheet size={32} className="text-slate-400 group-hover:text-white transition-colors" />
                        <div className="text-center">
                            <h3 className="text-lg font-bold">Import Excel</h3>
                            <p className="text-xs text-slate-400 mt-1">.xlsx / .xls</p>
                        </div>
                        <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
                    </div>

                    {/* Option B: Demo Data (15 Agents) */}
                    <div
                        className="flex-1 bg-slate-100 text-slate-900 rounded-xl p-8 cursor-pointer hover:bg-slate-200 transition-all flex flex-col items-center justify-center gap-4 group active:scale-95 border-2 border-transparent hover:border-slate-300"
                        onClick={handleDemoClick}
                    >
                        <PlayCircle size={32} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                        <div className="text-center">
                            <h3 className="text-lg font-bold">Try Demo</h3>
                            <p className="text-xs text-slate-400 mt-1">15 Agents</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff List Modal (중간 검문소) */}
            {showStaffList && (
                <StaffListModal
                    onClose={() => setShowStaffList(false)}
                    isInitialSetup={true} // 초기 설정 모드임을 알림 (버튼 텍스트 변경 등)
                />
            )}
        </>
    );
}
