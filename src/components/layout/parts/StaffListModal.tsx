"use client";

import React, { useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Trash2, UserPlus, ChevronDown, Play, Check, Shield, Star, Users } from 'lucide-react';
import { Resource } from '@/lib/engine/types';

// Helper to map Level (1-6) to Readable Roles
const getLevelLabel = (level: number) => {
    if (level >= 6) return 'Head (수)';
    if (level === 5) return 'Charge (책임)';
    if (level === 4) return 'Senior (주임)';
    if (level === 3) return 'Junior (일반)';
    if (level === 2) return 'Newbie II (신규)';
    return 'Newbie I (수습)';
};

const getLevelColor = (level: number) => {
    if (level >= 6) return 'bg-purple-100 text-purple-700 hover:border-purple-200';
    if (level >= 5) return 'bg-rose-100 text-rose-700 hover:border-rose-200';
    if (level >= 4) return 'bg-blue-100 text-blue-700 hover:border-blue-200';
    if (level >= 3) return 'bg-green-100 text-green-700 hover:border-green-200';
    return 'bg-yellow-100 text-yellow-700 hover:border-yellow-200';
};

export default function StaffListModal({ onClose, isInitialSetup = false }: { onClose: () => void, isInitialSetup?: boolean }) {
    const resources = useScheduleStore(s => s.resources);
    // Local state
    const [localResources, setLocalResources] = useState<Resource[]>(JSON.parse(JSON.stringify(resources)));

    const handleSaveAndStart = () => {
        useScheduleStore.setState(state => {
            state.resources = localResources;
            const size = localResources.length * state.days;

            if (state.schedule.length !== size) {
                state.schedule = new Uint8Array(size);
                // Smart Random Initialization
                if (isInitialSetup) {
                    for (let k = 0; k < size; k++) {
                        const r = Math.random();
                        if (r < 0.25) state.schedule[k] = 1; // D
                        else if (r < 0.5) state.schedule[k] = 2; // E
                        else if (r < 0.75) state.schedule[k] = 3; // N (Code 3)
                        else state.schedule[k] = 0; // Off
                    }
                }
                state.blameMatrix = new Float32Array(size);
            }

            if (isInitialSetup) {
                state.isGenerating = true; // Auto Start (Fixed Prop Name)
            }
        });
        onClose();
    };

    // Generalized Handler for PDR 2.0 Props
    const handleChange = (idx: number, field: keyof Resource | 'levelStr', value: any) => {
        const newRes = [...localResources];
        const target = newRes[idx];

        if (field === 'name') target.name = value;
        else if (field === 'team') target.team = value;
        else if (field === 'levelStr') {
            target.level = parseInt(value, 10);
        }

        setLocalResources(newRes);
    };

    const handleDelete = (idx: number) => {
        if (confirm("정말 이 근무자를 명단에서 삭제하시겠습니까? (복구 불가)")) {
            setLocalResources(localResources.filter((_, i) => i !== idx));
        }
    };

    const handleAdd = () => {
        setLocalResources([
            ...localResources,
            {
                id: `manual_${Date.now()}`,
                name: 'New Staff',
                team: 'A',
                level: 1, // Default Newbie
                targetNight: 5,
                targetEvening: 5,
                minOff: 8,
                isPreceptor: false,
                forbiddenShifts: [],
                requests: {}
            }
        ]);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            {isInitialSetup ? <><Shield className="text-indigo-600" /> Setup Team Roster</> : <><Users className="text-teal-600" /> Staff Management</>}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {isInitialSetup
                                ? '근무표 생성 전, 직원 명단과 등급(Level)을 최종 확인해주세요.'
                                : `총 ${localResources.length}명의 간호사가 등록되어 있습니다.`}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {!isInitialSetup && (
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 font-bold text-sm">Cancel</button>
                        )}
                        <button
                            onClick={handleSaveAndStart}
                            className={`px-6 py-2 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${isInitialSetup ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                        >
                            {isInitialSetup ? <Play size={16} /> : <Check size={16} />}
                            {isInitialSetup ? 'Confirm & Start Engine' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-auto p-0 scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white sticky top-0 shadow-sm z-10 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 border-b w-[60px]">No.</th>
                                <th className="px-6 py-3 border-b w-[200px]">Name</th>
                                <th className="px-6 py-3 border-b w-[120px]">Team</th>
                                <th className="px-6 py-3 border-b w-[220px]">Skill Level (Rank)</th>
                                <th className="px-6 py-3 border-b">Constraints (Off/Night)</th>
                                <th className="px-6 py-3 border-b text-center w-[80px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {localResources.map((res, idx) => (
                                <tr key={res.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="px-6 py-3 text-sm text-slate-400 font-mono text-center">{idx + 1}</td>

                                    {/* Name Input */}
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={res.name}
                                            onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                            className="w-full bg-transparent font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/50 rounded px-2 py-1 transition-all"
                                        />
                                    </td>

                                    {/* Team Selector */}
                                    <td className="px-6 py-3">
                                        <select
                                            value={res.team}
                                            onChange={(e) => handleChange(idx, 'team', e.target.value)}
                                            className="bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 px-2 py-1 cursor-pointer hover:bg-slate-200"
                                        >
                                            <option value="A">Team A</option>
                                            <option value="B">Team B</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </td>

                                    {/* Level Selector (Core Logic) */}
                                    <td className="px-6 py-3">
                                        <div className="relative">
                                            <select
                                                value={res.level}
                                                onChange={(e) => handleChange(idx, 'levelStr', e.target.value)}
                                                className={`w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold outline-none border-2 border-transparent cursor-pointer transition-colors ${getLevelColor(res.level)}`}
                                            >
                                                <option value="6">Level 6 - Head (수)</option>
                                                <option value="5">Level 5 - Charge (책)</option>
                                                <option value="4">Level 4 - Senior (주)</option>
                                                <option value="3">Level 3 - Junior (일)</option>
                                                <option value="2">Level 2 - Newbie II (신)</option>
                                                <option value="1">Level 1 - Newbie I (습)</option>
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-current pointer-events-none opacity-50" size={14} />
                                        </div>
                                    </td>

                                    {/* Constraints Info (Read-only Preview) */}
                                    <td className="px-6 py-3 text-xs text-slate-400">
                                        <div className="flex gap-2">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded">Min Off: {res.minOff ?? 8}</span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded">Max N: {res.targetNight ?? 7}</span>
                                        </div>
                                    </td>

                                    {/* Delete Action */}
                                    <td className="px-6 py-3 text-center">
                                        <button
                                            onClick={() => handleDelete(idx)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Add Button */}
                            <tr>
                                <td colSpan={6} className="p-2">
                                    <button
                                        onClick={handleAdd}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <UserPlus size={16} /> Add New Staff manually
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
