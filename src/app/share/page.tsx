"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LZString from 'lz-string';
import { Resource } from '@/lib/engine/types';
import { ChevronLeft, Search, Calendar, User, Clock } from 'lucide-react';

// Shift definition (View Layer)
const SHIFT_MAP: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: 'OFF', color: 'text-slate-400', bg: 'bg-slate-100' },
    1: { label: 'DAY', color: 'text-blue-600', bg: 'bg-blue-100' }, // Day
    2: { label: 'EVE', color: 'text-green-600', bg: 'bg-green-100' }, // Eve
    4: { label: 'NIG', color: 'text-red-500', bg: 'bg-red-100' }, // Night
};

function ShareContent() {
    const searchParams = useSearchParams();
    const [scheduleData, setScheduleData] = useState<{
        resources: Resource[];
        days: number;
        schedule: Uint8Array;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNurse, setSelectedNurse] = useState<string | null>(null);

    useEffect(() => {
        const data = searchParams.get('data');
        if (!data) {
            setError("데이터가 없습니다.");
            return;
        }

        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(data);
            if (!decompressed) throw new Error("압축 해제 실패");

            const parsed = JSON.parse(decompressed);
            // Reconstruct Uint8Array (JSON converts it to object/array)
            const scheduleArr = new Uint8Array(Object.values(parsed.schedule));

            setScheduleData({
                resources: parsed.resources,
                days: parsed.days,
                schedule: scheduleArr
            });
        } catch (err) {
            console.error(err);
            setError("유효하지 않은 링크입니다.");
        }
    }, [searchParams]);

    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
    if (!scheduleData) return <div className="p-8 text-center text-slate-500">Loading Schedule...</div>;

    // Helper
    const getRoleName = (level: number) => {
        if (level >= 6) return 'Head Nurse';
        if (level === 5) return 'Charge Nurse';
        if (level === 4) return 'Senior Nurse';
        if (level === 3) return 'Junior Nurse';
        if (level === 2) return 'Newbie';
        return 'Rookie';
    };

    // Filter Logic
    const filteredNurses = scheduleData.resources.filter(r =>
        r.name.includes(searchTerm) || getRoleName(r.level).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNurseClick = (id: string) => {
        setSelectedNurse(id);
    };

    // My Schedule View
    if (selectedNurse) {
        const nurse = scheduleData.resources.find(r => r.id === selectedNurse);
        const nurseIdx = scheduleData.resources.findIndex(r => r.id === selectedNurse);
        if (!nurse) return null;

        return (
            <div className="min-h-screen bg-slate-50 pb-8">
                <div className="bg-white sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setSelectedNurse(null)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ChevronLeft className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">{nurse.name}</h1>
                        <p className="text-xs text-slate-500">{getRoleName(nurse.level)} • 30 Days Forecast</p>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-7 gap-2">
                    {Array.from({ length: scheduleData.days }).map((_, dayIdx) => {
                        const idx = nurseIdx * scheduleData.days + dayIdx;
                        const code = scheduleData.schedule[idx];
                        const shift = SHIFT_MAP[code] || SHIFT_MAP[0];

                        return (
                            <div key={dayIdx} className={`aspect-square rounded-xl flex flex-col items-center justify-center border shadow-sm ${shift.bg} ${code === 0 ? 'border-slate-200 opacity-50' : 'border-transparent'}`}>
                                <span className="text-[10px] font-bold text-slate-400 mb-0.5">{dayIdx + 1}</span>
                                <span className={`text-xs font-black ${shift.color}`}>{shift.label[0]}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="px-4 mt-2">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-teal-500" /> Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <div className="text-xs text-blue-400 font-bold">Duty</div>
                                <div className="text-lg font-black text-blue-600">
                                    {Array.from({ length: scheduleData.days }).filter((_, d) => {
                                        const c = scheduleData.schedule[nurseIdx * scheduleData.days + d];
                                        return c === 1 || c === 2;
                                    }).length}
                                </div>
                            </div>
                            <div className="bg-red-50 p-2 rounded-lg">
                                <div className="text-xs text-red-400 font-bold">Night</div>
                                <div className="text-lg font-black text-red-600">
                                    {Array.from({ length: scheduleData.days }).filter((_, d) => {
                                        const c = scheduleData.schedule[nurseIdx * scheduleData.days + d];
                                        return c === 4;
                                    }).length}
                                </div>
                            </div>
                            <div className="bg-slate-100 p-2 rounded-lg">
                                <div className="text-xs text-slate-400 font-bold">Off</div>
                                <div className="text-lg font-black text-slate-600">
                                    {Array.from({ length: scheduleData.days }).filter((_, d) => {
                                        const c = scheduleData.schedule[nurseIdx * scheduleData.days + d];
                                        return c === 0;
                                    }).length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white sticky top-0 z-10 border-b px-6 py-4 shadow-sm">
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="text-teal-500" />
                    Nurse Schedule
                </h1>
                <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search your name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="p-4 space-y-3">
                {filteredNurses.map((nurse) => (
                    <div
                        key={nurse.id}
                        onClick={() => handleNurseClick(nurse.id)}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-98 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-teal-400`}>
                                {nurse.name[0]}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800">{nurse.name}</div>
                                <div className="text-xs text-slate-400 font-medium">{getRoleName(nurse.level)}</div>
                            </div>
                        </div>
                        <ChevronLeft className="rotate-180 text-slate-300" size={20} />
                    </div>
                ))}

                {filteredNurses.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        No nurse found.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SharePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
            <ShareContent />
        </Suspense>
    );
}
