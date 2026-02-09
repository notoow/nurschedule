"use client";

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Printer } from 'lucide-react';
import LZString from 'lz-string';
import { useScheduleStore } from '@/store/useScheduleStore';

export default function ShareModal({ onClose }: { onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    // 1. Data Compression
    const state = useScheduleStore.getState();
    const payload = {
        resources: state.resources,
        days: state.days,
        schedule: Array.from(state.schedule) // Uint8Array -> Array
    };

    // LZ-String Compression
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));

    // Construct URL (Production Aware)
    // window.location.origin 사용 (클라이언트 사이드에서만 안전)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const shareUrl = `${origin}/share?data=${compressed}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none">

                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors print:hidden">
                    <X size={20} className="text-slate-500" />
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-slate-800">Scan & Check Duty</h3>
                </div>

                {/* QR Code Zone */}
                <div className="flex flex-col items-center justify-center gap-4 mb-6 print:mb-0">
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
                        <QRCodeSVG value={shareUrl} size={200} level="M" includeMargin={true} />
                    </div>
                    <p className="text-xs text-slate-400 font-mono break-all max-w-[90%] text-center hidden print:block">
                        {shareUrl}
                    </p>
                </div>

                {/* Actions (Hidden in Print) */}
                <div className="space-y-3 print:hidden">
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <input
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-transparent text-xs text-slate-500 font-mono outline-none"
                        />
                        <button onClick={handleCopy} className="text-teal-600 font-bold text-xs flex items-center gap-1 hover:underline">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-300 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Printer size={18} /> Print QR Code
                    </button>
                </div>

                {/* Print Only Footer */}
                <div className="hidden print:block text-center mt-8 border-t pt-4">
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Nurse Roster</h1>
                    <p className="text-sm text-slate-500">Scan this code to view the schedule on your device.</p>
                    <p className="text-xs text-slate-400 mt-4">Powered by NurSchedule AI</p>
                </div>
            </div>
        </div>
    );
}
