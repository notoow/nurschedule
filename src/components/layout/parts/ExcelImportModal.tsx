"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Check, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { cleanAndParseExcel } from '@/lib/utils/excelImport';
import { downloadTemplate } from '@/lib/utils/excelExport';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Resource } from '@/lib/engine/types';

// Shadcn-like Dialog (Inner Logic)
export default function ExcelImportModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Resource[]>([]);
    const [importedMeta, setImportedMeta] = useState<{ startDate: string, days: number } | undefined>(undefined);
    const [importedSchedule, setImportedSchedule] = useState<Uint8Array | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setResources = useScheduleStore(s => (res: Resource[]) => {
        useScheduleStore.setState(state => {
            state.resources = res;
            // Resize Matrix matches new resources * current days (will be updated if meta exists)
            const size = res.length * state.days;
            state.schedule = new Uint8Array(size); // Will undergo another resize if setDays called later?
            state.blameMatrix = new Float32Array(size);
        });
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            try {
                const { resources, meta, schedule } = await cleanAndParseExcel(f);
                setPreviewData(resources);
                setImportedMeta(meta);
                setImportedSchedule(schedule);
                setStep('preview');
            } catch (err) {
                alert("엑셀 파일 형식이 올바르지 않습니다.");
                console.error(err);
            }
        }
    };

    const handleConfirm = () => {
        useScheduleStore.setState(state => {
            if (importedMeta) {
                state.startDate = importedMeta.startDate;
                state.days = importedMeta.days;
            }
            state.resources = previewData;

            const currentDays = importedMeta ? importedMeta.days : state.days;
            const size = previewData.length * currentDays;

            if (importedSchedule && importedSchedule.length === size) {
                state.schedule = new Uint8Array(importedSchedule);
            } else {
                state.schedule = new Uint8Array(size);
            }

            state.blameMatrix = new Float32Array(size);
            state.history = [];
            state.future = [];
        });

        onClose();
        alert(`${previewData.length}명의 직원 정보${importedMeta ? '와 설정' : ''}이 성공적으로 불러와졌습니다!`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-green-600" />
                        Staff Import Wizard
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    {step === 'upload' ? (
                        <>
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="p-4 bg-slate-100 rounded-full group-hover:scale-110 transition-transform">
                                    <Upload size={32} className="text-slate-500 group-hover:text-teal-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-700 text-lg">Click or Drag Excel File</p>
                                    <p className="text-sm text-slate-400 mt-1">.xlsx, .xls format supported</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={() => downloadTemplate()}
                                    className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                                >
                                    <FileSpreadsheet size={14} /> Download Service Template
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-600">Preview ({previewData.length} Agents)</span>
                                {importedMeta && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">📅 {importedMeta.startDate} ({importedMeta.days}일)</span>}
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Smart Mapping Active ✨</span>
                            </div>

                            <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 border-b">Name</th>
                                            <th className="px-4 py-2 border-b">Auto-Detected Level</th>
                                            <th className="px-4 py-2 border-b">Team</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 10).map((r) => (
                                            <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium">{r.name}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.level >= 5 ? 'bg-purple-100 text-purple-700' :
                                                        r.level >= 3 ? 'bg-green-100 text-green-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {r.level >= 6 ? 'Head' : r.level === 5 ? 'Charge' : r.level === 4 ? 'Senior' : r.level === 3 ? 'Junior' : 'Newbie'}
                                                        (Lv.{r.level})
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-500 font-mono">{r.team}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t">
                                        + {previewData.length - 10} more rows...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
                    {step === 'upload' ? (
                        <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                    ) : (
                        <>
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-colors">Re-upload</button>
                            <button onClick={handleConfirm} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg shadow-teal-200 flex items-center gap-2 transition-transform active:scale-95">
                                <Check size={18} /> Confirm Import
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
