import {ValidationError} from "@/app/utils/types";

/**
 * Runs cross-entity validations requiring multiple datasets.
 * @param clients Parsed clients data array.
 * @param workers Parsed workers data array.
 * @param tasks Parsed tasks data array.
 * @returns CrossValidationResult with errors and detailed errors.
 */
export default function crossValidateAll(clients: any[], workers: any[], tasks: any[]) {
    const errors: string[] = [];
    const detailed: ValidationError[] = [];

    const clientIDs = new Set(clients.map(c => String(c.ClientID).trim()).filter(Boolean));
    const workerIDs = new Set(workers.map(w => String(w.WorkerID).trim()).filter(Boolean));
    const taskIDs = new Set(tasks.map(t => String(t.TaskID).trim()).filter(Boolean));

    tasks.forEach((task, index) => {
        if (task.ClientID && String(task.ClientID).trim() !== '' && !clientIDs.has(String(task.ClientID).trim())) {
            const message = `ClientID "${task.ClientID}" not found in Clients data.`;
            errors.push(`Task Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'ClientID', message });
        }
        if (task.WorkerID && String(task.WorkerID).trim() !== '' && !workerIDs.has(String(task.WorkerID).trim())) {
            const message = `WorkerID "${task.WorkerID}" not found in Workers data.`;
            errors.push(`Task Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'WorkerID', message });
        }
        if (task.ParentTaskID && String(task.ParentTaskID).trim() !== '' && !taskIDs.has(String(task.ParentTaskID).trim())) {
            const message = `ParentTaskID "${task.ParentTaskID}" not found in Tasks data.`;
            errors.push(`Task Row ${index + 1}: ${message}`);
            detailed.push({ rowIndex: index, field: 'ParentTaskID', message });
        }
    });

    clients.forEach((client, index) => {
        const requestedTaskIDs = (String(client.RequestedTaskIDs || '').split(',')).map((id: string) => id.trim()).filter(Boolean);
        requestedTaskIDs.forEach(reqID => {
            if (!taskIDs.has(reqID)) {
                const message = `RequestedTaskID "${reqID}" not found in Tasks data.`;
                errors.push(`Client Row ${index + 1}: ${message}`);
                detailed.push({ rowIndex: index, field: 'RequestedTaskIDs', message });
            }
        });
    });

    return { errors: [...new Set(errors)], detailed };
};
