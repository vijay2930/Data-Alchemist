import {ValidationError} from "@/app/utils/types";

/**
 * Validates task data.
 * @param data Array of task objects.
 * @returns ValidationResult with errors and detailed errors.
 */
export default function validateTasks  (data: any[])  {
    const errors: string[] = [];
    const detailed: ValidationError[] = [];
    data.forEach((row, index) => {
        if (!row.TaskID || String(row.TaskID).trim() === '') {
            const message = 'TaskID is required.';
            errors.push(`Task Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'TaskID', message });
        }
        if (row.Duration && (isNaN(Number(row.Duration)) || Number(row.Duration) < 1)) {
            const message = 'Duration must be a number >= 1.';
            errors.push(`Task Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'Duration', message });
        }
    });
    return { errors, detailed };
};
