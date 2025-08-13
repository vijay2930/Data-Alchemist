import {ValidationError} from "@/app/utils/types";

/**
 * Validates worker data.
 * @param data Array of worker objects.
 * @returns ValidationResult with errors and detailed errors.
 */
export default function validateWorkers (data: any[]){
    const errors: string[] = [];
    const detailed: ValidationError[] = [];
    data.forEach((row, index) => {
        if (!row.WorkerID || String(row.WorkerID).trim() === '') {
            const message = 'WorkerID is required.';
            errors.push(`Worker Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'WorkerID', message });
        }
        if (row.MaxLoadPerPhase && (isNaN(Number(row.MaxLoadPerPhase)) || Number(row.MaxLoadPerPhase) < 1)) {
            const message = 'MaxLoadPerPhase must be a number >= 1.';
            errors.push(`Worker Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'MaxLoadPerPhase', message });
        }
    });
    return { errors, detailed };
};