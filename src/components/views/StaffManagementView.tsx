"use client";

import React, { useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import {
    Trash2, UserPlus, ChevronDown, ChevronRight, Users,
    FileSpreadsheet, Shield, Moon, Sun, GraduationCap, XCircle, Sunset, UserMinus, RotateCcw, RotateCw
} from 'lucide-react';
import { Resource } from '@/lib/engine/types';
import ExcelImportModal from '@/components/layout/parts/ExcelImportModal';

// --- Level Helper ---
const getLevelColor = (level: number) => {
    if (level >= 6) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (level === 5) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (level === 4) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (level === 3) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
};

// --- Staff Card Component (Expandable) ---
const StaffCard = ({
    resource: res,
    idx,
    onUpdate,
    onDelete,
    allResources
}: {
    resource: Resource,
    idx: number,
    onUpdate: (id: string, updates: Partial<Resource>) => void,
    onDelete: (id: string) => void,
    allResources: Resource[]
}) => {
    const [isExpanded, setExpanded] = useState(false);

    // Toggle Forbidden Shift (Safety Toggle)
    const toggleForbidden = (shift: string) => {
        const current = res.forbiddenShifts || [];
        const exists = current.includes(shift);
        const newForbidden = exists
            ? current.filter(s => s !== shift)
            : [...current, shift];
        onUpdate(res.id, { forbiddenShifts: newForbidden });
    };

    return (
        <div className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'border-teal-200 shadow-md ring-1 ring-teal-100' : 'border-slate-200 hover:border-slate-300'}`}>
            {/* Header / Summary Row */}
            <div
                className="flex items-center p-4 cursor-pointer"
                onClick={() => setExpanded(!isExpanded)}
            >
                {/* Expander Icon */}
                <div className={`mr-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={18} />
                </div>

                {/* Index & Name */}
                <div className="flex items-center gap-4 w-[250px]">
                    <span className="text-xs font-mono text-slate-400 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                    <input
                        type="text"
                        value={res.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdate(res.id, { name: e.target.value })}
                        className="font-bold text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 rounded px-2 py-1 outline-none transition-all text-base w-full"
                    />
                </div>

                {/* Last Month Shift (PDR Phase 3) */}
                <div className="flex flex-col items-center justify-center px-1 border-r border-slate-100 mx-2 h-10 w-[50px]" onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Last</span>
                    <select
                        value={res.prevShift || '0'}
                        onChange={(e) => onUpdate(res.id, { prevShift: e.target.value })}
                        className={`text-xs font-black rounded px-1 py-0.5 outline-none cursor-pointer text-center w-full appearance-none
                            ${(res.prevShift === '3') ? 'text-rose-500 bg-rose-50' : 'text-slate-600 bg-slate-50'}
                         `}
                        title="Last Month End Shift"
                    >
                        <option value="1">D</option>
                        <option value="2">E</option>
                        <option value="3">N</option>
                        <option value="0">O</option>
                    </select>
                </div>

                {/* Team Selector Check */}

                {/* Team Selector */}
                <div className="w-[120px] px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={res.team}
                        onChange={(e) => {
                            const newTeam = e.target.value;
                            const isInactive = newTeam === 'Inactive';
                            onUpdate(res.id, {
                                team: newTeam,
                                excludeFromCount: isInactive ? true : res.excludeFromCount // Inactive면 자동 제외
                            });
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 outline-none cursor-pointer"
                    >
                        <option value="A">Team A</option>
                        <option value="B">Team B</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                {/* Level Badge */}
                <div className="w-[150px] px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={res.level}
                        onChange={(e) => onUpdate(res.id, { level: parseInt(e.target.value) })}
                        className={`w-full appearance-none px-3 py-1.5 rounded-lg text-xs font-bold outline-none border cursor-pointer hover:opacity-90 transition-colors ${getLevelColor(res.level)}`}
                    >
                        <option value="6">Lv.6 Head</option>
                        <option value="5">Lv.5 Charge</option>
                        <option value="4">Lv.4 Senior</option>
                        <option value="3">Lv.3 Junior</option>
                        <option value="2">Lv.2 Newbie</option>
                        <option value="1">Lv.1 Rookie</option>
                    </select>
                </div>

                {/* Quick Summary Badges */}
                <div className="flex-1 flex gap-2 justify-end px-4">
                    {res.fixedShift && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded flex items-center gap-1">
                            <Shield size={10} /> Fixed: {res.fixedShift}
                        </span>
                    )}
                    {res.isPreceptor && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded flex items-center gap-1">
                            <GraduationCap size={10} /> Preceptor
                        </span>
                    )}
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                        Target N: {res.targetNight}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                        Min Off: {res.minOff}
                    </span>
                </div>
            </div>

            {/* Constraints Expansion Panel */}
            {isExpanded && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. Target Setting (Slider & Input) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Moon size={12} /> Target Night
                                </label>
                                <span className="text-sm font-black text-slate-700">{res.targetNight}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="10"
                                value={res.targetNight}
                                onChange={(e) => onUpdate(res.id, { targetNight: parseInt(e.target.value) })}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                            />
                            <div className="flex justify-between text-[9px] text-slate-300 mt-1 font-mono">
                                <span>0</span><span>5</span><span>10</span>
                            </div>
                        </div>

                        {/* 1.5 Target Evening (New PDR 3.1) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sunset size={12} /> Target Eve
                                </label>
                                <span className="text-sm font-black text-slate-700">{res.targetEvening}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="15"
                                value={res.targetEvening || 0}
                                onChange={(e) => onUpdate(res.id, { targetEvening: parseInt(e.target.value) })}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[9px] text-slate-300 mt-1 font-mono">
                                <span>0</span><span>8</span><span>15</span>
                            </div>
                        </div>

                        {/* 2. Min Off Setting */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sun size={12} /> Min Off Days
                                </label>
                                <span className="text-sm font-black text-slate-700">{res.minOff}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="15"
                                value={res.minOff}
                                onChange={(e) => onUpdate(res.id, { minOff: parseInt(e.target.value) })}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between text-[9px] text-slate-300 mt-1 font-mono">
                                <span>0</span><span>8</span><span>15</span>
                            </div>
                        </div>

                        {/* 3. Special Roles */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Special Roles</label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={res.excludeFromCount || false}
                                    onChange={(e) => onUpdate(res.id, { excludeFromCount: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-slate-400 focus:ring-slate-400"
                                />
                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors flex items-center gap-1">
                                    <UserMinus size={12} /> Count Exception
                                </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={res.isPreceptor}
                                    onChange={(e) => onUpdate(res.id, { isPreceptor: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Assign as Preceptor</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={res.fixedShift === 'D'}
                                    onChange={(e) => onUpdate(res.id, { fixedShift: e.target.checked ? 'D' : undefined })}
                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">Fixed Day Shift (Head Rule)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={res.isWeekdayDayOnly || false}
                                    onChange={(e) => onUpdate(res.id, { isWeekdayDayOnly: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors flex items-center gap-1">
                                    <Sun size={12} className="text-rose-500" /> Weekday Day Only (Head)
                                </span>
                            </label>
                        </div>

                        {/* 3.5 Preceptorship (New Feature) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <GraduationCap size={12} /> Education Match
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="text-xs text-slate-500">Assign Preceptor:</div>
                                <select
                                    value={res.onTraining || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onUpdate(res.id, {
                                            onTraining: val || undefined,
                                            excludeFromCount: !!val // 프리셉터 지정 시 자동으로 TO 제외
                                        });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                                >
                                    <option value="">-- None --</option>
                                    {allResources
                                        .filter(r => r.isPreceptor && r.id !== res.id)
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.level >= 5 ? 'Charge' : 'Senior'})
                                            </option>
                                        ))
                                    }
                                </select>
                                {res.onTraining && (
                                    <p className="text-[10px] text-teal-600 font-medium">
                                        * Schedules will be synced with preceptor.<br />
                                        * Excluded from TO count.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 4. Forbidden Shifts (Constraints) */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Forbidden Shifts</label>
                            <div className="flex gap-2">
                                {['N', 'E'].map(s => {
                                    const isForbidden = (res.forbiddenShifts || []).includes(s);
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => toggleForbidden(s)}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1
                                                ${isForbidden
                                                    ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                        >
                                            <XCircle size={12} />
                                            No {s}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(res.id); }}
                            className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14} /> Remove Staff
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main View ---

export default function StaffManagementView() {
    const resources = useScheduleStore(s => s.resources);
    const setResources = useScheduleStore(s => s.setResources);
    const updateResource = useScheduleStore(s => s.updateResource);
    const generateSmartSeed = useScheduleStore(s => s.generateSmartSeed);

    // Safety Undo
    const undo = useScheduleStore(s => s.undo);
    const redo = useScheduleStore(s => s.redo);
    const history = useScheduleStore(s => s.history);
    const future = useScheduleStore(s => s.future);

    const [showImport, setShowImport] = useState(false);

    const handleAdd = () => {
        const newRes: Resource = {
            id: `manual_${Date.now()}`,
            name: 'New Nurse',
            team: 'A',
            level: 1,
            targetNight: 5,
            targetEvening: 5, // PDR 3.1
            minOff: 8,
            isPreceptor: false,
            forbiddenShifts: [],
            requests: {}
        };
        setResources([...resources, newRes]);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this staff?")) {
            setResources(resources.filter(r => r.id !== id));
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header Toolbar */}
            <div className="flex items-center gap-6 p-6 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="text-teal-600" />
                        Staff Management <span className="text-teal-600 text-sm font-bold bg-teal-50 px-2 py-1 rounded-full">{resources.length}</span>
                    </h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                        PDR 3.0 Engine Enabled (Smart Target & Preference)
                    </p>
                </div>

                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={undo}
                        disabled={history.length === 0}
                        className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                        title="Undo (Ctrl+Z)"
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={future.length === 0}
                        className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                        title="Redo (Ctrl+Y)"
                    >
                        <RotateCw size={14} />
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-1"></div>

                    <button
                        onClick={() => generateSmartSeed(15)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:border-teal-500 text-slate-600 hover:text-teal-600 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                    >
                        <Shield size={14} /> Reset & Load Demo (15)
                    </button>
                    <button
                        onClick={() => setShowImport(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                    >
                        <FileSpreadsheet size={14} /> Import Data
                    </button>
                </div>
            </div>

            {/* Main List Area */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
                {resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                        <Users size={48} className="text-slate-300 mb-4" />
                        <p className="text-slate-500 font-bold mb-6 text-lg">등록된 간호사가 없습니다.</p>
                        <div className="flex gap-4">
                            <button onClick={() => generateSmartSeed(15)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-teal-600 transition-colors shadow-sm flex items-center gap-2">
                                <Shield size={18} /> 데모 데이터 (15명)
                            </button>
                            <button onClick={handleAdd} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg flex items-center gap-2">
                                <UserPlus size={18} /> 직접 추가하기
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3">
                            {resources.map((res, idx) => (
                                <StaffCard
                                    key={res.id}
                                    resource={res}
                                    idx={idx}
                                    onUpdate={updateResource}
                                    onDelete={handleDelete}
                                    allResources={resources} // 📦 Pass Full List
                                />
                            ))}
                        </div>

                        {/* Add Button Row */}
                        <div className="pt-4 border-t border-slate-200">
                            <button
                                onClick={handleAdd}
                                className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <UserPlus size={18} /> Add New Nurse
                            </button>
                        </div>
                    </>
                )}
            </div>

            {showImport && <ExcelImportModal onClose={() => setShowImport(false)} />}
        </div>
    );
}
