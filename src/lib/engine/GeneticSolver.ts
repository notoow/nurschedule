import { ScheduleMatrix, ConstraintConfig, DailyRequirement, Resource } from './types';

/**
 * 🔒 Note: This is an Open Source version.
 * The core scheduling algorithm (GeneticSolver) is hidden in this public repository.
 * The UI is fully functional, but "Auto Schedule" will not work.
 */
export class GeneticSolver {
    constructor(
        private constraints: ConstraintConfig[],
        private days: number,
        private resources: Resource[],
        private startDate: string,
        private reqWeekday: DailyRequirement,
        private reqWeekend: DailyRequirement
    ) { }

    /**
     * Public Placeholder
     */
    public evolve(population: ScheduleMatrix[]): ScheduleMatrix[] {
        console.warn("Auto-Scheduling Logic is not available in the public demo.");
        return population; // No evolution
    }
}
