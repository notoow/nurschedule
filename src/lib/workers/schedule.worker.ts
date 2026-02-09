// Web Worker Entry Point
/// <reference lib="webworker" />
import { expose } from "comlink";
import { GeneticSolver } from "../engine";
import { ConstraintConfig, ScheduleMatrix, DailyRequirement, Resource } from "../engine/types";
import { UniversalValidator } from "../engine/validator";

export interface WorkerApi {
    initialize: (
        resources: Resource[],
        days: number,
        constraints: ConstraintConfig[],
        startDate: string, // 📅
        reqWeekday: DailyRequirement,
        reqWeekend: DailyRequirement
    ) => void;

    runEvolution: (startGen: number) => Promise<{
        bestSchedule: ScheduleMatrix;
        bestScore: number;
        gen: number;
        blame: Float32Array;
    }>;
}

let solver: GeneticSolver | null = null;
let currentPopulation: ScheduleMatrix[] = [];
let resourceData: Resource[] = [];
let days = 0;
let constraints: ConstraintConfig[] = [];
let startDateStr: string = ""; // 📅
let reqWeekday: DailyRequirement = { D: 2, E: 2, N: 2 };
let reqWeekend: DailyRequirement = { D: 2, E: 2, N: 2 };

const api: WorkerApi = {
    initialize: (fullResources, dayCount, constraintConfigs, sDate, rWeekday, rWeekend) => {
        resourceData = fullResources;
        days = dayCount;
        constraints = constraintConfigs;
        startDateStr = sDate; // 📅
        reqWeekday = rWeekday;
        reqWeekend = rWeekend;

        solver = new GeneticSolver(constraints, days, resourceData, startDateStr, reqWeekday, reqWeekend);

        // 초기 인구 생성 (Random Seed)
        const totalSize = resourceData.length * days;
        currentPopulation = [];

        for (let i = 0; i < 100; i++) {
            const genome = new Uint8Array(totalSize);
            for (let k = 0; k < genome.length; k++) {
                const r = Math.random();
                if (r < 0.23) genome[k] = 3; // Night (Target approx)
                else if (r < 0.5) genome[k] = 2; // Eve
                else if (r < 0.8) genome[k] = 1; // Day
                else genome[k] = 0; // Off
            }
            currentPopulation.push(genome);
        }
    },

    runEvolution: async (startGen: number) => {
        if (!solver || currentPopulation.length === 0) throw new Error("Solver not initialized");

        const BATCH_SIZE = 50;
        for (let i = 0; i < BATCH_SIZE; i++) {
            currentPopulation = solver.evolve(currentPopulation);
        }

        const bestGenome = currentPopulation[0];

        // Final Evaluation for Reporting
        const blame = new Float32Array(bestGenome.length);

        // 🧬 Post-Processing: Preceptee Synchronization (Copy Schedule)
        // 프리셉티는 프리셉터의 근무를 그대로 따라간다.
        resourceData.forEach((res, idx) => {
            if (res.onTraining) {
                const preceptorIdx = resourceData.findIndex(r => r.id === res.onTraining);
                if (preceptorIdx !== -1) {
                    const start = idx * days;
                    const pStart = preceptorIdx * days;
                    // Copy Preceptor's Schedule to Preceptee
                    bestGenome.set(bestGenome.subarray(pStart, pStart + days), start);
                }
            }
        });

        const bestScore = UniversalValidator.evaluate(bestGenome, constraints, days, resourceData, startDateStr, reqWeekday, reqWeekend, blame);

        return {
            bestSchedule: bestGenome,
            bestScore,
            gen: startGen + BATCH_SIZE,
            blame
        };
    }
};

expose(api);
