/**
 * Converts a phase input (range, list or array) to an explicit array of phase numbers.
 * @param raw Any phase input: "1-3", "2,4,5", [1, 3, 5], or an empty string/null.
 */
export function normalizePhases(raw: any): number[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(Number).filter(n => !isNaN(n));

    if (typeof raw === 'string') {
        const trimmed = raw.trim();

        // Handle JSON-like array string, e.g., "[1, 3, 5]"
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map(Number).filter(n => !isNaN(n));
                }
            } catch {
                // Fall through to other parsing methods if JSON fails
            }
        }

        // Handle range like "1-4"
        if (/^\d+\-\d+$/.test(trimmed)) {
            const [start, end] = trimmed.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start > end) return [];
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }

        // Handle comma-separated, e.g., "2, 4, 5"
        return trimmed.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    return [];
}