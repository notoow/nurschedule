import { useEffect, useRef } from 'react';
import { wrap, Remote } from 'comlink';
import { useScheduleStore } from '@/store/useScheduleStore';
// Worker의 타입을 가져오기 위해 import type 사용. 실제 런타임 로딩은 new Worker()로 함.
import type { WorkerApi } from '@/lib/workers/schedule.worker';

export function useWorkerEngine() {
    const workerRef = useRef<Worker | null>(null);
    const apiRef = useRef<Remote<WorkerApi> | null>(null);

    const isGenerating = useScheduleStore(s => s.isGenerating);
    const resources = useScheduleStore(s => s.resources);
    const days = useScheduleStore(s => s.days);
    const startDate = useScheduleStore(s => s.startDate); // 📅

    const constraints = useScheduleStore(s => s.constraints);
    const reqWeekday = useScheduleStore(s => s.reqWeekday);
    const reqWeekend = useScheduleStore(s => s.reqWeekend);

    const updateSchedule = useScheduleStore(s => s.updateSchedule);
    const setGenerating = useScheduleStore(s => s.setGenerating);
    const generationCount = useScheduleStore(s => s.generationCount);

    // 1. Worker Lifecycle Management
    useEffect(() => {
        // Next.js (Webpack) 환경에서 Worker 로딩 시 절대 경로 문제 해결을 위해
        // new URL(..., import.meta.url) 패턴 사용이 필수적임.
        // 또한 파일 위치가 변경되었으므로 경로 수정: ../worker.ts -> ../lib/workers/schedule.worker.ts

        const worker = new Worker(
            new URL('../lib/workers/schedule.worker.ts', import.meta.url),
            { type: 'module' } // Module output 지원
        );

        const api = wrap<WorkerApi>(worker);

        workerRef.current = worker;
        apiRef.current = api;

        return () => {
            worker.terminate();
        };
    }, []);

    // 2. Data Synchronization (Reset Engine on Config Change)
    useEffect(() => {
        if (!apiRef.current) return;

        // 설정 변경 시 생성 중지
        if (isGenerating) setGenerating(false);

        // 엔진 초기화
        apiRef.current.initialize(resources, days, constraints, startDate, reqWeekday, reqWeekend)
            .catch(err => console.error("Engine Init Failed:", err));

    }, [resources, days, constraints, startDate, reqWeekday, reqWeekend, isGenerating, setGenerating]);

    // 3. Generation Loop
    useEffect(() => {
        let isActive = true;

        const runLoop = async () => {
            if (!isGenerating || !apiRef.current || !isActive) return;

            try {
                // Run Batch
                const result = await apiRef.current.runEvolution(useScheduleStore.getState().generationCount);

                // Update Store
                if (isActive && isGenerating) {
                    updateSchedule(result.bestSchedule, result.bestScore, result.gen);
                    requestAnimationFrame(runLoop);
                }
            } catch (err) {
                console.error("Evolution Error:", err);
                setGenerating(false);
            }
        };

        if (isGenerating) {
            runLoop();
        } else {
            isActive = false;
        }

        return () => { isActive = false; };
    }, [isGenerating, updateSchedule, setGenerating]);
}
