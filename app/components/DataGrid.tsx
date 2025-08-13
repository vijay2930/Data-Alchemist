import {EntityType, ValidationError} from "@/app/utils/types";
import {useMemo} from "react";
import {ChevronDown, ChevronUp} from "lucide-react";

export default function DataGrid({
                      data,
                      errors,
                      cellErrors,
                      filters,
                      setFilters,
                      sortConfig,
                      setSortConfig,
                      updateCell,
                      activeView,
                  }: {
    data: any[];
    errors: string[];
    cellErrors: ValidationError[];
    filters: Record<string, string>;
    setFilters: (filters: Record<string, string>) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    setSortConfig: (config: { key: string; direction: 'asc' | 'desc' } | null) => void;
    updateCell: (rowIndex: number, field: string, value: any) => void;
    activeView: EntityType;
})
{
    const filteredAndSortedData = useMemo(() => {
        let filtered = data.filter((row) =>
            Object.entries(filters).every(([col, val]) => !val || String(row[col] ?? '').toLowerCase().includes(val.toLowerCase()))
        );
        if (sortConfig) {
            filtered = [...filtered].sort(
                (a, b) =>
                    String(a[sortConfig.key] ?? '').localeCompare(String(b[sortConfig.key] ?? ''), undefined, { sensitivity: 'base' }) *
                    (sortConfig.direction === 'asc' ? 1 : -1)
            );
        }
        return filtered;
    }, [data, filters, sortConfig]);

    if (data.length === 0) {
        return <p className="text-center text-gray-500 mt-4 text-lg">No data uploaded for this view. Upload a file to see the grid.</p>;
    }

    const columns = Object.keys(filteredAndSortedData[0] || {});

    return (
        <div className="overflow-x-auto relative shadow-md rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                    {columns.map((k) => (
                        <th
                            key={k}
                            onClick={() => setSortConfig({ key: k, direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' })}
                            className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 hover:bg-gray-200"
                        >
                            <div className="flex items-center">
                                {k}
                                {sortConfig?.key === k && (
                                    <span className="ml-2 text-gray-900">
                                        {sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </span>
                                )}
                            </div>
                        </th>
                    ))}
                </tr>
                <tr className="bg-white border-b border-gray-200">
                    {columns.map((k) => (
                        <th key={k} className="px-6 py-3">
                            <input
                                value={filters[k] ?? ''}
                                onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                                placeholder={`Filter ${k}`}
                            />
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                {filteredAndSortedData.map((row, ri) => {
                    const originalIndex = data.indexOf(row);
                    const isErrorRow = errors.some((err) => err.includes(`Row ${originalIndex + 1}`));
                    return (
                        <tr key={ri} className={isErrorRow ? 'bg-red-50 hover:bg-red-100 transition-colors duration-200' : 'odd:bg-gray-50 even:bg-white hover:bg-gray-100 transition-colors duration-200'}>
                            {columns.map((field) => {
                                const hasCellError = cellErrors.some((e) => e.rowIndex === originalIndex && e.field === field);
                                const msg = cellErrors.find((e) => e.rowIndex === originalIndex && e.field === field)?.message || '';
                                return (
                                    <td
                                        key={field}
                                        title={msg}
                                        className={`px-6 py-3 whitespace-nowrap text-base ${hasCellError ? 'bg-yellow-100 text-yellow-800' : 'text-gray-900'}`}
                                    >
                                        <input
                                            value={row[field] || ''}
                                            onChange={(e) => updateCell(originalIndex, field, e.target.value)}
                                            className={`w-full border rounded-md shadow-sm text-sm p-1.5 ${hasCellError ? 'border-yellow-500 focus:ring-yellow-500' : 'border-gray-300 focus:ring-blue-400'} focus:border-blue-400 transition-all duration-200`}
                                        />
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}