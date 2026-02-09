"use client";

import React, { useState } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Settings, Clock, Plus, Trash2, Calendar, ShieldAlert, CalendarCheck } from 'lucide-react';

// Tab Components
const ShiftTab = () => {
    const shiftTypes = useScheduleStore(s => s.shiftTypes);
    const addShiftType = useScheduleStore(s => s.addShiftType);
    const updateShiftType = useScheduleStore(s => s.updateShiftType);

    const handleAdd = () => {
        const id = (shiftTypes.length + 1).toString();
        addShiftType({
            id,
            name: 'New Shift',
            shortName: 'X',
            color: '#64748b',
            bgColor: '#f1f5f9',
            borderColor: '#cbd5e1',
            isOff: false,
            workHour: 8
        });
    };

    const PALETTE = [
        { c: '#ef4444', bg: '#fef2f2', b: '#fecaca' }, // Red
        { c: '#f97316', bg: '#fff7ed', b: '#ffedd5' }, // Orange
        { c: '#f59e0b', bg: '#fffbeb', b: '#fde68a' }, // Amber
        { c: '#84cc16', bg: '#f7fee7', b: '#d9f99d' }, // Lime
        { c: '#10b981', bg: '#ecfdf5', b: '#a7f3d0' }, // Emerald
        { c: '#06b6d4', bg: '#ecfeff', b: '#a5f3fc' }, // Cyan
        { c: '#3b82f6', bg: '#eff6ff', b: '#bfdbfe' }, // Blue
        { c: '#6366f1', bg: '#eef2ff', b: '#c7d2fe' }, // Indigo
        { c: '#8b5cf6', bg: '#f5f3ff', b: '#ddd6fe' }, // Violet
        { c: '#ec4899', bg: '#fdf2f8', b: '#fbcfe8' }, // Pink
        { c: '#64748b', bg: '#f8fafc', b: '#e2e8f0' }, // Slate
    ];

    const applyPreset = (id: string, p: typeof PALETTE[0]) => {
        updateShiftType(id, { color: p.c, bgColor: p.bg, borderColor: p.b });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Shift Definitions</h3>
                    <p className="text-sm text-slate-400">Define the types of duties available in your roster.</p>
                </div>
                <button onClick={handleAdd} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors">
                    <Plus size={14} /> Add Pattern
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shiftTypes.map((shift) => (
                    <div key={shift.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4">
                            {!['1', '2', '3', '0'].includes(shift.id) && (
                                <button className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-inner"
                                style={{ backgroundColor: shift.bgColor, color: shift.color, border: `1px solid ${shift.borderColor}` }}
                            >
                                {shift.shortName}
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={shift.name}
                                    onChange={(e) => updateShiftType(shift.id, { name: e.target.value })}
                                    className="font-bold text-slate-800 text-sm bg-transparent outline-none w-full border-b border-transparent focus:border-slate-300 placeholder-slate-300"
                                    placeholder="Shift Name"
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CODE:</span>
                                    <input
                                        type="text"
                                        value={shift.shortName}
                                        onChange={(e) => updateShiftType(shift.id, { shortName: e.target.value.slice(0, 2) })}
                                        className="w-8 text-[10px] font-mono bg-slate-50 text-center rounded ring-1 ring-slate-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Color Theme</label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {PALETTE.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => applyPreset(shift.id, p)}
                                            className="w-4 h-4 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: p.c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                                        <input
                                            type="color"
                                            value={shift.color}
                                            onChange={(e) => updateShiftType(shift.id, { color: e.target.value })}
                                            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-0"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">{shift.color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Work Hours</label>
                                <input
                                    type="number"
                                    value={shift.workHour}
                                    onChange={(e) => updateShiftType(shift.id, { workHour: Number(e.target.value) })}
                                    className="w-full text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={shift.isOff}
                                onChange={(e) => updateShiftType(shift.id, { isOff: e.target.checked })}
                                id={`off-${shift.id}`}
                                className="accent-teal-600"
                            />
                            <label htmlFor={`off-${shift.id}`} className="text-xs font-bold text-slate-500 cursor-pointer">Mark as "OFF" Duty</label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NeedsTab = () => {
    const reqWeekday = useScheduleStore(s => s.reqWeekday);
    const reqWeekend = useScheduleStore(s => s.reqWeekend);
    const setRequirement = useScheduleStore(s => s.setRequirement);

    const Counter = ({ val, onChange }: { val: number, onChange: (n: number) => void }) => (
        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
            <button onClick={() => onChange(Math.max(0, val - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded font-bold transition-colors">-</button>
            <span className="flex-1 text-center font-bold text-slate-700 w-12">{val}</span>
            <button onClick={() => onChange(val + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 rounded font-bold transition-colors">+</button>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Staffing Requirements (T.O.)</h3>
                <p className="text-sm text-slate-400">Set the minimum number of nurses required for each shift.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Calendar size={16} />
                        </div>
                        <h4 className="font-bold text-slate-700">Weekday Standard</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 w-24">AM (Day)</span>
                            <Counter val={reqWeekday.D} onChange={(v) => setRequirement('weekday', 'D', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 w-24">PM (Eve)</span>
                            <Counter val={reqWeekday.E} onChange={(v) => setRequirement('weekday', 'E', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 w-24">Night</span>
                            <Counter val={reqWeekday.N} onChange={(v) => setRequirement('weekday', 'N', v)} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <CalendarCheck size={16} />
                        </div>
                        <h4 className="font-bold text-slate-700">Weekend / Holiday</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 w-24">AM (Day)</span>
                            <Counter val={reqWeekend.D} onChange={(v) => setRequirement('weekend', 'D', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 w-24">PM (Eve)</span>
                            <Counter val={reqWeekend.E} onChange={(v) => setRequirement('weekend', 'E', v)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 w-24">Night</span>
                            <Counter val={reqWeekend.N} onChange={(v) => setRequirement('weekend', 'N', v)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConstraintsTab = () => {
    const constraints = useScheduleStore(s => s.constraints);
    const updateConstraint = useScheduleStore(s => s.updateConstraint);

    const getPriorityColor = (p: string) => {
        if (p === 'Must') return 'text-rose-600 bg-rose-50 border-rose-100';
        if (p === 'High') return 'text-orange-600 bg-orange-50 border-orange-100';
        if (p === 'Medium') return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-slate-500 bg-slate-100 border-slate-200';
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Rule Constraints</h3>
                <p className="text-sm text-slate-400">Configure the rules that the AI engine must follow.</p>
            </div>

            <div className="space-y-3">
                {constraints.map((rule) => (
                    <div
                        key={rule.constraintId}
                        className={`flex items-start justify-between p-4 rounded-xl border transition-all ${rule.isEnabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    checked={rule.isEnabled}
                                    onChange={(e) => updateConstraint(rule.constraintId, { isEnabled: e.target.checked })}
                                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                                />
                            </div>
                            <div>
                                <h4 className={`font-bold text-sm ${rule.isEnabled ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{rule.displayName}</h4>
                                <p className="text-xs text-slate-400 mt-1">{rule.description}</p>

                                {rule.isEnabled && (
                                    <div className="flex items-center gap-3 mt-3">
                                        <select
                                            value={rule.priorityLevel}
                                            onChange={(e) => updateConstraint(rule.constraintId, { priorityLevel: e.target.value as any })}
                                            className={`text-[10px] font-bold px-2 py-1 rounded border outline-none cursor-pointer ${getPriorityColor(rule.priorityLevel)}`}
                                        >
                                            <option value="Must">Must (Critical)</option>
                                            <option value="High">High Priority</option>
                                            <option value="Medium">Medium Priority</option>
                                            <option value="Low">Low Priority</option>
                                        </select>

                                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                                            <span className="text-[10px] font-bold text-slate-400">Penalty:</span>
                                            <input
                                                type="number"
                                                value={rule.penaltyWeight}
                                                onChange={(e) => updateConstraint(rule.constraintId, { penaltyWeight: Number(e.target.value) })}
                                                className="w-12 bg-transparent text-xs font-bold text-slate-700 outline-none text-right"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoadTab = () => {
    const resources = useScheduleStore(s => s.resources);
    const updateResource = useScheduleStore(s => s.updateResource);
    const autoDistributeTargets = useScheduleStore(s => s.autoDistributeTargets);
    const reqWeekday = useScheduleStore(s => s.reqWeekday);
    const reqWeekend = useScheduleStore(s => s.reqWeekend);
    const days = useScheduleStore(s => s.days);
    const startDate = useScheduleStore(s => s.startDate);

    // Calc Total Needed
    const calcTotalNeeded = (shift: 'N' | 'E') => {
        let total = 0;
        const start = new Date(startDate);
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            total += isWeekend ? reqWeekend[shift] : reqWeekday[shift];
        }
        return total;
    };

    const totalNightNeeded = calcTotalNeeded('N');
    const totalNightAllocated = resources.reduce((sum, r) => sum + (r.excludeFromCount ? 0 : r.targetNight), 0);
    const diffN = totalNightAllocated - totalNightNeeded;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-2 ${diffN === 0 ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Night Duty Pool</h4>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black ${diffN === 0 ? 'text-teal-600' : 'text-amber-500'}`}>
                            {totalNightAllocated}
                        </span>
                        <span className="text-lg font-bold text-slate-400 mb-1">/ {totalNightNeeded}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {diffN === 0 ? (
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full flex items-center gap-1">
                                <ShieldAlert size={12} /> Perfect Match
                            </span>
                        ) : diffN > 0 ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                +{diffN} Overflow (Delete some)
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                                {diffN} Deficit (Add more)
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                    <button
                        onClick={autoDistributeTargets}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Settings size={20} />
                        Auto-Distribute (1/N)
                    </button>
                    <p className="text-xs text-slate-400 text-center px-4">
                        * Automatically distributes night shifts equally among active staff, balancing totals.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex text-xs font-bold text-slate-500 uppercase">
                    <div className="w-8 text-center">#</div>
                    <div className="w-32">Name</div>
                    <div className="flex-1 px-4">Target Night Slider</div>
                    <div className="w-16 text-center">Value</div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {resources.map((r, i) => (
                        <div key={r.id} className={`flex items-center px-4 py-3 hover:bg-slate-50 transition-colors ${r.excludeFromCount ? 'opacity-40 grayscale' : ''}`}>
                            <div className="w-8 text-center text-xs font-mono text-slate-400">{i + 1}</div>
                            <div className="w-32 truncate font-bold text-slate-700 text-sm" title={r.name}>
                                {r.name}
                                {r.excludeFromCount && <span className="ml-1 text-[10px] bg-slate-200 text-slate-500 px-1 rounded">EXC</span>}
                            </div>
                            <div className="flex-1 px-4">
                                <input
                                    type="range"
                                    min="0" max="15"
                                    disabled={r.excludeFromCount}
                                    value={r.targetNight}
                                    onChange={(e) => updateResource(r.id, { targetNight: parseInt(e.target.value) })}
                                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${r.excludeFromCount ? 'bg-slate-200' : 'bg-slate-200 accent-teal-600'
                                        }`}
                                />
                            </div>
                            <div className="w-16 text-center font-black text-slate-800 text-lg">
                                {r.targetNight}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main View ---

export default function RosterConfigView() {
    const [activeTab, setActiveTab] = useState<'shifts' | 'needs' | 'constraints' | 'load'>('shifts');

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Settings className="text-teal-600" />
                        Roster Configuration
                    </h2>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 pt-6">
                <div className="flex items-center gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('shifts')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'shifts' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Shift Types
                    </button>
                    <button
                        onClick={() => setActiveTab('needs')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'needs' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Daily Requirements
                    </button>
                    <button
                        onClick={() => setActiveTab('constraints')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'constraints' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Constraint Rules
                    </button>
                    <button
                        onClick={() => setActiveTab('load')}
                        className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'load' ? 'border-teal-500 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Workload Balance
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                {activeTab === 'shifts' && <ShiftTab />}
                {activeTab === 'needs' && <NeedsTab />}
                {activeTab === 'constraints' && <ConstraintsTab />}
                {activeTab === 'load' && <LoadTab />}
            </div>
        </div>
    );
}
