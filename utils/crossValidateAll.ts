import { ValidationError } from './validateData';
import { normalizePhases } from './normalizePhases';

export interface CrossValidationResult {
    errors: string[];            // summary error messages
    detailed: ValidationError[]; // per-cell structured errors
}

/**
 * Runs cross-entity validations requiring multiple datasets.
 * @param clients - parsed clients data array
 * @param workers - parsed workers data array
 * @param tasks - parsed tasks data array
 */
export function crossValidateAll(
    clients: any[],
    workers: any[],
    tasks: any[]
): CrossValidationResult {
    const errors: string[] = [];
    const detailed: ValidationError[] = [];

    const taskIDs = new Set(tasks.map(t => t.TaskID));
    const workerSkills = new Set(workers.flatMap(w =>
        (w.Skills || '').split(',').map((s: string) => s.trim())
    ).filter(Boolean));

    // 1. Unknown references: RequestedTaskIDs not in tasks
    clients.forEach((c, cIdx) => {
        const reqTasks = (c.RequestedTaskIDs || '').split(',').map((t: string) => t.trim()).filter(Boolean);
        reqTasks.forEach((rt: string) => {
            if (!taskIDs.has(rt)) {
                const msg = `Requested task "${rt}" not found in Tasks`;
                errors.push(`Client Row ${cIdx + 1}: ${msg}`);
                detailed.push({ rowIndex: cIdx, field: 'RequestedTaskIDs', message: msg });
            }
        });
    });

    // 2. Overloaded workers: AvailableSlots.length < MaxLoadPerPhase
    workers.forEach((w, wIdx) => {
        const slots = normalizePhases(w.AvailableSlots);
        const maxLoad = Number(w.MaxLoadPerPhase);
        if (slots.length < maxLoad) {
            const msg = `AvailableSlots (${slots.length}) < MaxLoadPerPhase (${maxLoad})`;
            errors.push(`Worker Row ${wIdx + 1}: ${msg}`);
            detailed.push({ rowIndex: wIdx, field: 'AvailableSlots', message: msg });
        }
    });

    // 3. Skill coverage: every RequiredSkill in tasks covered by ≥ 1 worker
    tasks.forEach((t, tIdx) => {
        const reqSkills = (t.RequiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        reqSkills.forEach((skill: string) => {
            if (!workerSkills.has(skill)) {
                const msg = `Required skill "${skill}" not covered by any worker`;
                errors.push(`Task Row ${tIdx + 1}: ${msg}`);
                detailed.push({ rowIndex: tIdx, field: 'RequiredSkills', message: msg });
            }
        });
    });

    // 4. MaxConcurrent check against number of qualified workers
    tasks.forEach((t, tIdx) => {
        const reqSkills = (t.RequiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        if (reqSkills.length > 0) {
            const qualifiedCount = workers.filter(w =>
                reqSkills.every((skill: string) => (w.Skills || '').split(',').map((s: string) => s.trim()).includes(skill))
            ).length;
            if (Number(t.MaxConcurrent) > qualifiedCount) {
                const msg = `MaxConcurrent (${t.MaxConcurrent}) > qualified workers (${qualifiedCount})`;
                errors.push(`Task Row ${tIdx + 1}: ${msg}`);
                detailed.push({ rowIndex: tIdx, field: 'MaxConcurrent', message: msg });
            }
        }
    });

    return {
        errors: [...new Set(errors)],
        detailed
    };
}