export interface ValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface ValidationResult {
    errors: string[];
    detailed: ValidationError[];
}


function checkMissingColumns(data: any[], requiredCols: string[]): ValidationError[] {
    const details: ValidationError[] = [];
    requiredCols.forEach((col) => {
        if (!data.every(row => row.hasOwnProperty(col))) {
            data.forEach((_, idx) => {
                details.push({
                    rowIndex: idx,
                    field: col,
                    message: `Missing required column: ${col}`
                });
            });
        }
    });
    return details;
}

/**
 * Helper: duplicate ID detection
 */
function checkDuplicateIDs(data: any[], idField: string): ValidationError[] {
    const details: ValidationError[] = [];
    const ids = data.map(row => row[idField]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) {
        data.forEach((row, idx) => {
            if (dupes.includes(row[idField])) {
                details.push({
                    rowIndex: idx,
                    field: idField,
                    message: `Duplicate ${idField}`
                });
            }
        });
    }
    return details;
}

function isValidJSON(val: string): boolean {
    try {
        JSON.parse(val);
        return true;
    } catch {
        return false;
    }
}

/**
 * Clients validation
 */
export function validateClients(clients: any[]): ValidationResult {
    const summary: string[] = [];
    const detailed: ValidationError[] = [];

    const requiredCols = [
        'ClientID',
        'ClientName',
        'PriorityLevel',
        'RequestedTaskIDs',
        'GroupTag',
        'AttributesJSON'
    ];

    const missing = checkMissingColumns(clients, requiredCols);
    detailed.push(...missing);
    if (missing.length) summary.push(...[...new Set(missing.map(e => e.message))]);

    const dupes = checkDuplicateIDs(clients, 'ClientID');
    detailed.push(...dupes);
    if (dupes.length) summary.push('Duplicate ClientID(s) found');

    clients.forEach((c, idx) => {
        const p = Number(c.PriorityLevel);
        if (isNaN(p) || p < 1 || p > 5) {
            const msg = 'PriorityLevel must be between 1 and 5';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'PriorityLevel', message: msg });
        }

        if (!c.RequestedTaskIDs || typeof c.RequestedTaskIDs !== 'string') {
            const msg = 'RequestedTaskIDs is empty or invalid';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'RequestedTaskIDs', message: msg });
        }

        if (!isValidJSON(c.AttributesJSON)) {
            const msg = 'Invalid JSON';
            summary.push(`Row ${idx + 1}: ${msg} in AttributesJSON`);
            detailed.push({ rowIndex: idx, field: 'AttributesJSON', message: msg });
        }
    });

    return { errors: [...new Set(summary)], detailed };
}

/**
 * Workers validation
 */
export function validateWorkers(workers: any[]): ValidationResult {
    const summary: string[] = [];
    const detailed: ValidationError[] = [];

    const requiredCols = [
        'WorkerID',
        'WorkerName',
        'Skills',
        'AvailableSlots',
        'MaxLoadPerPhase',
        'WorkerGroup',
        'QualificationLevel'
    ];

    const missing = checkMissingColumns(workers, requiredCols);
    detailed.push(...missing);
    if (missing.length) summary.push(...[...new Set(missing.map(e => e.message))]);

    const dupes = checkDuplicateIDs(workers, 'WorkerID');
    detailed.push(...dupes);
    if (dupes.length) summary.push('Duplicate WorkerID(s) found');

    workers.forEach((w, idx) => {
        // Skills
        if (!w.Skills || typeof w.Skills !== 'string') {
            const msg = 'Skills is empty or invalid';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'Skills', message: msg });
        }

        // AvailableSlots must be array of numbers
        try {
            const arr = typeof w.AvailableSlots === 'string' ? JSON.parse(w.AvailableSlots) : w.AvailableSlots;
            if (!Array.isArray(arr) || arr.some(num => typeof num !== 'number')) {
                throw new Error('Invalid');
            }
        } catch {
            const msg = 'AvailableSlots must be array of numbers';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'AvailableSlots', message: msg });
        }

        const max = Number(w.MaxLoadPerPhase);
        if (isNaN(max) || max < 1) {
            const msg = 'MaxLoadPerPhase must be >= 1';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'MaxLoadPerPhase', message: msg });
        }
    });

    return { errors: [...new Set(summary)], detailed };
}

/**
 * Tasks validation
 */
export function validateTasks(tasks: any[]): ValidationResult {
    const summary: string[] = [];
    const detailed: ValidationError[] = [];

    const requiredCols = [
        'TaskID',
        'TaskName',
        'Category',
        'Duration',
        'RequiredSkills',
        'PreferredPhases',
        'MaxConcurrent'
    ];

    const missing = checkMissingColumns(tasks, requiredCols);
    detailed.push(...missing);
    if (missing.length) summary.push(...[...new Set(missing.map(e => e.message))]);

    const dupes = checkDuplicateIDs(tasks, 'TaskID');
    detailed.push(...dupes);
    if (dupes.length) summary.push('Duplicate TaskID(s) found');

    tasks.forEach((t, idx) => {
        const dur = Number(t.Duration);
        if (isNaN(dur) || dur < 1) {
            const msg = 'Duration must be >= 1';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'Duration', message: msg });
        }

        if (!t.RequiredSkills || typeof t.RequiredSkills !== 'string') {
            const msg = 'RequiredSkills is empty or invalid';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'RequiredSkills', message: msg });
        }

        const phaseStr = String(t.PreferredPhases || '').trim();
        if (!/^\d+-\d+$/.test(phaseStr) && !/^\[.*\]$/.test(phaseStr)) {
            const msg = 'PreferredPhases should be range "1-3" or JSON array';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'PreferredPhases', message: msg });
        }

        const maxc = Number(t.MaxConcurrent);
        if (isNaN(maxc) || maxc < 1) {
            const msg = 'MaxConcurrent must be >= 1';
            summary.push(`Row ${idx + 1}: ${msg}`);
            detailed.push({ rowIndex: idx, field: 'MaxConcurrent', message: msg });
        }
    });

    return { errors: [...new Set(summary)], detailed };
}
