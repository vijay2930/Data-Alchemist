import {ValidationError} from "@/app/utils/types";

/**
 * Validates client data.
 * @param data Array of client objects.
 * @returns ValidationResult with errors and detailed errors.
 */
export default function validateClients (data: any[]){
    const errors: string[] = [];
    const detailed: ValidationError[] = [];
    data.forEach((row, index) => {
        if (!row.ClientID || String(row.ClientID).trim() === '') {
            const message = 'ClientID is required.';
            errors.push(`Client Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'ClientID', message });
        }
        if (row.PriorityLevel && (isNaN(Number(row.PriorityLevel)) || Number(row.PriorityLevel) < 1 || Number(row.PriorityLevel) > 5)) {
            const message = 'PriorityLevel must be between 1 and 5.';
            errors.push(`Client Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'PriorityLevel', message });
        }
    });
    return { errors, detailed };
};
