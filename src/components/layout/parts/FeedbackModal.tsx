import React from 'react';
import Giscus from '@giscus/react';
import { X, MessageSquareQuote } from 'lucide-react';

interface FeedbackModalProps {
    onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content (Split Layout) */}
            <div className="relative bg-white w-full max-w-5xl h-[85vh] md:h-[650px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden ring-1 ring-slate-900/5">

                {/* Close Button (Absolute) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-sm transition-all"
                >
                    <X size={20} />
                </button>

                {/* Left Panel (Info & Guide) */}
                <div className="w-full md:w-[320px] bg-slate-50 border-r border-slate-100 p-6 md:p-8 flex flex-col shrink-0 overflow-y-auto md:overflow-visible">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                            <MessageSquareQuote size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Feedback</h2>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                Powered by GitHub
                            </p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group mb-4">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-50 to-transparent -mr-6 -mt-6 rounded-full pointer-events-none" />
                            <h3 className="font-bold text-slate-800 text-sm mb-2">
                                👋 안녕하세요!
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                더 나은 서비스를 위해 여러분의 목소리를 들려주세요.
                            </p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-400">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" /> 버그/오류 제보
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> 기능 추가 요청
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" /> 응원 메시지
                                </li>
                            </ul>
                        </div>

                        <div className="text-[11px] text-slate-400 font-medium px-2">
                            * 원활한 소통을 위해 <strong>GitHub 로그인</strong>이 필요합니다.
                            <br />
                            * 작성하신 내용은 <strong>공개 저장소</strong>에 등록됩니다.
                        </div>
                    </div>

                    {/* Footer for Left Panel */}
                    <div className="mt-8 pt-6 border-t border-slate-200/60 hidden md:block">
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                            DutyMaker는 오픈소스 프로젝트입니다.<br />
                            여러분의 기여로 함께 성장합니다.
                        </p>
                    </div>
                </div>

                {/* Right Panel (Giscus Thread) */}
                <div className="flex-1 bg-white relative flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <div className="max-w-3xl mx-auto min-h-[400px]">
                            <Giscus
                                id="comments"
                                repo="notoow/nurschedule"
                                repoId="R_kgDORLu9pg"
                                category="General"
                                categoryId="DIC_kwDORLu9ps4C2EQ7"
                                mapping="pathname"
                                term="Welcome to DutyMaker Feedback"
                                reactionsEnabled="1"
                                emitMetadata="0"
                                inputPosition="top"
                                theme="light"
                                lang="ko"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
