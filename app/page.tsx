'use client';

import {useState, useMemo, useEffect} from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import {  Download, CheckCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import FileUploader from "@/app/components/FileUploader";
import {ValidationError,EntityType,RuleType,Rule,Weights,presetProfiles} from "@/app/utils/types";
import parseCSV from "@/app/utils/parseCSV";
import parseXLSX from "@/app/utils/parseXLSX";
import validateClients from "@/app/utils/validateClients";
import validateWorkers from "@/app/utils/validateWorkers";
import validateTasks from "@/app/utils/validateTasks";
import crossValidateAll from "@/app/utils/crossValidateAll";
import DataGrid from "@/app/components/DataGrid";



export default function DataRulesPrioritiesPage() {
    const [tab, setTab] = useState<'data' | 'rules' | 'priorities'>('data');
    const [isLoading, setIsLoading] = useState(false);

    const [clients, setClients] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const [clientsErrors, setClientsErrors] = useState<string[]>([]);
    const [workersErrors, setWorkersErrors] = useState<string[]>([]);
    const [tasksErrors, setTasksErrors] = useState<string[]>([]);
    const [clientsCellErrors, setClientsCellErrors] = useState<ValidationError[]>([]);
    const [workersCellErrors, setWorkersCellErrors] = useState<ValidationError[]>([]);
    const [tasksCellErrors, setTasksCellErrors] = useState<ValidationError[]>([]);
    const [crossErrors, setCrossErrors] = useState<string[]>([]);
    const [crossCellErrors, setCrossCellErrors] = useState<ValidationError[]>([]);

    const [activeView, setActiveView] = useState<EntityType>('clients');

    const [viewStates, setViewStates] = useState<Record<EntityType, { filters: Record<string, string>; sortConfig: { key: string; direction: 'asc' | 'desc' } | null }>>({
        clients: { filters: {}, sortConfig: null },
        workers: { filters: {}, sortConfig: null },
        tasks: { filters: {}, sortConfig: null },
    });

    const [rules, setRules] = useState<Rule[]>([]);
    const [ruleType, setRuleType] = useState<RuleType>('coRun');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [slotGroup, setSlotGroup] = useState('');
    const [minSlots, setMinSlots] = useState(1);
    const [workerGroup, setWorkerGroup] = useState('');
    const [maxLoad, setMaxLoad] = useState(1);
    const [phaseTask, setPhaseTask] = useState('');
    const [allowedPhases, setAllowedPhases] = useState('');
    const [regex, setRegex] = useState('');
    const [template, setTemplate] = useState('');
    const [precedenceOrder, setPrecedenceOrder] = useState('');

    const [weights, setWeights] = useState<Weights>(presetProfiles.Balanced);

    /**
     * Runs cross-validation across all datasets.
     * @param cData Clients data.
     * @param wData Workers data.
     * @param tData Tasks data.
     */
    const runCrossValidation = (cData: any[], wData: any[], tData: any[]) => {
        const cross = crossValidateAll(cData, wData, tData);
        setCrossErrors(cross.errors);
        setCrossCellErrors(cross.detailed);
    };
    /**
     * Handles file acceptance and triggers validation for the specific entity utils.
     * @param file The accepted File object.
     * @param type The entity utils ('clients', 'workers', 'tasks').
     */
    const handleFile = async (file: File, type: EntityType) => {
        setIsLoading(true);
        let parsed: any[] = [];
        try {
            if (file.name.endsWith('.csv')) parsed = await parseCSV(file);
            else if (file.name.endsWith('.xlsx')) parsed = await parseXLSX(file);
            else throw new Error('Unsupported file utils');
        } catch (error) {
            alert('File parsing failed: ' + (error as Error).message);
            setIsLoading(false);
            return;
        }
        setIsLoading(false);

        if (parsed.length === 0) {
            alert('No data found in file');
            return;
        }

        const runValidation = (parsedData: any[], validator: (data: any[]) => { errors: string[]; detailed: ValidationError[] }, setData: (data: any[]) => void, setErr: (err: string[]) => void, setCellErr: (err: ValidationError[]) => void) => {
            const res = validator(parsedData);
            setData(parsedData);
            setErr(res.errors);
            setCellErr(res.detailed);
        };
        console.log("type",type)
        if (type === 'clients') {
            runValidation(parsed, validateClients, setClients, setClientsErrors, setClientsCellErrors);
            runCrossValidation(parsed, workers, tasks);
        } else if (type === 'workers') {
            runValidation(parsed, validateWorkers, setWorkers, setWorkersErrors, setWorkersCellErrors);
            runCrossValidation(clients, parsed, tasks);
        } else if (type === 'tasks') {
            runValidation(parsed, validateTasks, setTasks, setTasksErrors, setTasksCellErrors);
            runCrossValidation(clients, workers, parsed);
        }

        if (parsed.length > 0 && parsed[0]) {
            setViewStates((prev) => ({
                ...prev,
                [type]: { ...prev[type], filters: Object.fromEntries(Object.keys(parsed[0]).map((c) => [c, ''])) },
            }));
        }
    };

    /**
     * Updates a cell in the active data view and re-runs validation.
     * @param type The entity utils ('clients', 'workers', 'tasks').
     * @param rowIndex The 0-based index of the row.
     * @param field The field (column name) to update.
     * @param value The new value for the cell.
     */
    const updateCell = (type: EntityType, rowIndex: number, field: string, value: any) => {
        const updateAndValidate = (dataset: any[], validator: (data: any[]) => { errors: string[]; detailed: ValidationError[] }, setData: (data: any[]) => void, setErr: (err: string[]) => void, setCellErr: (err: ValidationError[]) => void) => {
            const updated = [...dataset];
            if (updated[rowIndex]) {
                updated[rowIndex] = { ...updated[rowIndex], [field]: value };
            }
            const res = validator(updated);
            setData(updated);
            setErr(res.errors);
            setCellErr(res.detailed);
            return updated;
        };

        let updatedData: any[] = [];
        if (type === 'clients') {
            updatedData = updateAndValidate(clients, validateClients, setClients, setClientsErrors, setClientsCellErrors);
            runCrossValidation(updatedData, workers, tasks);
        } else if (type === 'workers') {
            updatedData = updateAndValidate(workers, validateWorkers, setWorkers, setWorkersErrors, setWorkersCellErrors);
            runCrossValidation(clients, updatedData, tasks);
        } else if (type === 'tasks') {
            updatedData = updateAndValidate(tasks, validateTasks, setTasks, setTasksErrors, setTasksCellErrors);
            runCrossValidation(clients, workers, updatedData);
        }
    };

    useEffect(() => {
        const currentData = activeView === 'clients' ? clients : activeView === 'workers' ? workers : tasks;
        if (currentData.length > 0 && Object.keys(viewStates[activeView].filters).length === 0) {
            setViewStates((prev) => ({
                ...prev,
                [activeView]: { ...prev[activeView], filters: Object.fromEntries(Object.keys(currentData[0]).map((c) => [c, ''])) },
            }));
        }
    }, [activeView, clients, workers, tasks, viewStates]);

    const currentData = activeView === 'clients' ? clients : activeView === 'workers' ? workers : tasks;
    const currentErrors = [
        ...(activeView === 'clients' ? clientsErrors : activeView === 'workers' ? workersErrors : tasksErrors),
        ...crossErrors.filter((e) => e.toLowerCase().includes(activeView.slice(0, -1).toLowerCase())),
    ];
    const currentCellErrors = [
        ...(activeView === 'clients' ? clientsCellErrors : activeView === 'workers' ? workersCellErrors : tasksCellErrors),
        ...crossCellErrors,
    ];

    const { filters: currentFilters, sortConfig: currentSortConfig } = useMemo(() => viewStates[activeView], [viewStates, activeView]);

    /**
     * Updates filters for the active data view.
     * @param newFilters The new filter object.
     */
    const setFilters = (newFilters: Record<string, string>) => {
        setViewStates((prev) => ({
            ...prev,
            [activeView]: { ...prev[activeView], filters: newFilters },
        }));
    };

    /**
     * Updates sort configuration for the active data view.
     * @param newSortConfig The new sort configuration.
     */
    const setSortConfig = (newSortConfig: { key: string; direction: 'asc' | 'desc' } | null) => {
        setViewStates((prev) => ({
            ...prev,
            [activeView]: { ...prev[activeView], sortConfig: newSortConfig },
        }));
    };

    /**
     * Converts a phase input (range, list or array) to an explicit array of phase numbers.
     * This function is needed for rules processing, not direct UI validation.
     * @param raw Any phase input: "1-3", "2,4,5", [1, 3, 5], or an empty string/null.
     */
    const parsePhaseInput = (input: string): number[] => {
        if (!input) return [];
        const trimmed = input.trim();

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

        if (/^\d+\-\d+$/.test(trimmed)) {
            const [start, end] = trimmed.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start > end) return [];
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }

        return trimmed.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    };

    /**
     * Adds a new rule based on the selected rule utils and inputs.
     */
    const addRule = () => {
        let newRule: Rule | null = null;
        switch (ruleType) {
            case 'coRun':
                if (!selectedTasks.length) { alert('Select at least one task'); return; }
                newRule = { type: 'coRun', tasks: selectedTasks }; break;
            case 'slotRestriction':
                if (!slotGroup.trim()) { alert('Enter group'); return; }
                newRule = { type: 'slotRestriction', group: slotGroup, minCommonSlots: minSlots }; break;
            case 'loadLimit':
                if (!workerGroup.trim()) { alert('Enter worker group'); return; }
                newRule = { type: 'loadLimit', workerGroup, maxSlotsPerPhase: maxLoad }; break;
            case 'phaseWindow':
                if (!phaseTask) { alert('Select task'); return; }
                const parsedPhases = parsePhaseInput(allowedPhases);
                if (parsedPhases.length === 0) { alert('Invalid phase input'); return; }
                newRule = { type: 'phaseWindow', taskId: phaseTask, allowedPhases: parsedPhases }; break;
            case 'patternMatch':
                if (!regex.trim()) { alert('Enter regex'); return; }
                newRule = { type: 'patternMatch', regex, template, params: {} }; break;
            case 'precedenceOverride':
                const order = precedenceOrder.split(',').map((s) => s.trim()).filter(s => s.length > 0);
                if (order.length === 0) { alert('Enter priority order'); return; }
                newRule = { type: 'precedenceOverride', priorityOrder: order }; break;
            default:
                break;
        }
        if (newRule) {
            setRules((prev) => [...prev, newRule]);
            setSelectedTasks([]); setSlotGroup(''); setMinSlots(1); setWorkerGroup(''); setMaxLoad(1);
            setPhaseTask(''); setAllowedPhases(''); setRegex(''); setTemplate(''); setPrecedenceOrder('');
        }
    };

    /**
     * Sets the prioritization weights based on a preset profile.
     * @param name The name of the preset profile.
     */
    const setPreset = (name: string) => {
        if (presetProfiles[name]) {
            setWeights(presetProfiles[name]);
        }
    };

    /**
     * Exports all current data (clients, workers, tasks, rules, weights) as a ZIP file.
     */
    const exportAll = async () => {
        const zip = new JSZip();
        const csvOpts = { header: true };

        if (clients.length > 0) zip.file('clients.csv', Papa.unparse(clients, csvOpts));
        if (workers.length > 0) zip.file('workers.csv', Papa.unparse(workers, csvOpts));
        if (tasks.length > 0) zip.file('tasks.csv', Papa.unparse(tasks, csvOpts));

        zip.file('rules.json', JSON.stringify(rules, null, 2));
        zip.file('weights.json', JSON.stringify(weights, null, 2));

        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'data-alchemist-export.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 p-8 font-sans">
            <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-8 transform transition-all duration-300 hover:shadow-2xl">
                {/* Header Section */}
                <header className="mb-8 pb-4 border-b border-gray-200">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Data Alchemist</h1>
                    <p className="text-gray-600 text-lg">Streamlining your data management, rules, and priorities.</p>
                </header>

                {/* Tabs */}
                <div className="border-b-2 border-gray-200 mb-8 flex space-x-2">
                    {['data', 'rules', 'priorities'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t as 'data' | 'rules' | 'priorities')}
                            className={`px-8 py-3 -mb-px text-lg font-bold rounded-t-xl focus:outline-none transition-all duration-300 ${
                                tab === t
                                    ? 'text-indigo-700 border-b-4 border-indigo-500 bg-white'
                                    : 'text-gray-600 hover:text-indigo-700 hover:bg-gray-100'
                            }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* === Data Tab === */}
                {tab === 'data' && (
                    <>
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                                <h3 className="text-xl font-semibold mb-3 text-gray-700">Clients Data</h3>
                                <FileUploader onFileAccepted={(f) => handleFile(f, 'clients')} />
                            </div>
                            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                                <h3 className="text-xl font-semibold mb-3 text-gray-700">Workers Data</h3>
                                <FileUploader onFileAccepted={(f) => handleFile(f, 'workers')} />
                            </div>
                            <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                                <h3 className="text-xl font-semibold mb-3 text-gray-700">Tasks Data</h3>
                                <FileUploader onFileAccepted={(f) => handleFile(f, 'tasks')} />
                            </div>
                        </div>

                        <div className="border-b border-gray-200 mb-6 flex space-x-2">
                            {(['clients', 'workers', 'tasks'] as EntityType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveView(type)}
                                    className={`px-5 py-2 text-base font-medium mr-2 rounded-lg transition-colors duration-200 shadow-sm ${
                                        activeView === type
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        {isLoading ? (
                            <p className="text-center text-gray-500 py-12 text-lg animate-pulse">Loading data...</p>
                        ) : (
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex-1 overflow-auto h-[70vh] border rounded-xl shadow-md">
                                    <DataGrid
                                        data={currentData}
                                        errors={currentErrors}
                                        cellErrors={currentCellErrors}
                                        filters={currentFilters}
                                        setFilters={setFilters}
                                        sortConfig={currentSortConfig}
                                        setSortConfig={setSortConfig}
                                        updateCell={(rowIndex, field, value) => updateCell(activeView, rowIndex, field, value)}
                                        activeView={activeView}
                                    />
                                </div>
                                <div className="lg:w-1/3 w-full bg-red-50 border border-red-300 rounded-xl p-6 h-[70vh] overflow-y-auto shadow-inner">
                                    <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center">
                                        <XCircle className="w-6 h-6 mr-2 text-red-500" /> Validation Errors
                                    </h3>
                                    {currentErrors.length > 0 ? (
                                        <ul className="list-disc ml-6 text-red-600 space-y-2">
                                            {currentErrors.map((err, idx) => <li key={idx} className="text-sm leading-relaxed">{err}</li>)}
                                        </ul>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-green-600">
                                            <CheckCircle className="w-12 h-12 mb-4" />
                                            <p className="font-semibold text-lg">No errors found. Looks good! 🎉</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* === Rules Tab === */}
                {tab === 'rules' && (
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="p-8 bg-white rounded-2xl shadow-xl">
                            <h2 className="text-3xl font-bold text-gray-800 mb-8">Rule Builder</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Rule Type</label>
                                <select
                                    value={ruleType}
                                    onChange={(e) => setRuleType(e.target.value as RuleType)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                >
                                    {['coRun', 'slotRestriction', 'loadLimit', 'phaseWindow', 'patternMatch', 'precedenceOverride'].map((rt) => (
                                        <option key={rt} value={rt}>{rt.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</option>
                                    ))}
                                </select>
                            </div>

                            {ruleType === 'coRun' && tasks.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Tasks to Co-Run (Multi-select)</label>
                                    <select
                                        multiple
                                        value={selectedTasks}
                                        onChange={(e) => setSelectedTasks(Array.from(e.target.selectedOptions, (o) => o.value))}
                                        className="block w-full border-gray-300 rounded-lg shadow-sm h-36 p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                    >
                                        {tasks.map((t) => (
                                            <option key={t.TaskID} value={t.TaskID}>{t.TaskID}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {ruleType === 'slotRestriction' && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Group Identifier (e.g., 'Team A')</label>
                                        <input
                                            type="text"
                                            placeholder="Enter group tag"
                                            value={slotGroup}
                                            onChange={(e) => setSlotGroup(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Common Slots</label>
                                        <input
                                            type="number"
                                            value={minSlots}
                                            onChange={(e) => setMinSlots(Number(e.target.value))}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                </>
                            )}

                            {ruleType === 'loadLimit' && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Worker Group (e.g., 'Engineers')</label>
                                        <input
                                            type="text"
                                            placeholder="Enter worker group tag"
                                            value={workerGroup}
                                            onChange={(e) => setWorkerGroup(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Slots Per Phase</label>
                                        <input
                                            type="number"
                                            value={maxLoad}
                                            onChange={(e) => setMaxLoad(Number(e.target.value))}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                </>
                            )}

                            {ruleType === 'phaseWindow' && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Task for Phase Window</label>
                                        <select
                                            value={phaseTask}
                                            onChange={(e) => setPhaseTask(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        >
                                            <option value="">Select a task...</option>
                                            {tasks.map((t) => (
                                                <option key={t.TaskID} value={t.TaskID}>{t.TaskID}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Phases (e.g., "1-3", "[1,3,5]", or "1,3,5")</label>
                                        <input
                                            type="text"
                                            placeholder='e.g., "1-3" or [1,3,5] or 1,3,5'
                                            value={allowedPhases}
                                            onChange={(e) => setAllowedPhases(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                </>
                            )}

                            {ruleType === 'patternMatch' && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Regex Pattern (e.g., `^Task-(\d+)$`)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter regex pattern"
                                            value={regex}
                                            onChange={(e) => setRegex(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Template (e.g., `'Task {1}'`)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter template string"
                                            value={template}
                                            onChange={(e) => setTemplate(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                        />
                                    </div>
                                </>
                            )}

                            {ruleType === 'precedenceOverride' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Order (comma-separated Task IDs)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 'TaskA, TaskB, TaskC'"
                                        value={precedenceOrder}
                                        onChange={(e) => setPrecedenceOrder(e.target.value)}
                                        className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                                    />
                                </div>
                            )}

                            <button
                                onClick={addRule}
                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Add Rule
                            </button>
                        </div>

                        <div className="p-8 bg-white rounded-2xl shadow-xl">
                            <h2 className="text-3xl font-bold text-gray-800 mb-8">Current Rules</h2>
                            {rules.length > 0 ? (
                                <textarea
                                    className="w-full h-[400px] border border-gray-300 rounded-lg p-4 font-mono text-sm bg-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    value={JSON.stringify(rules, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const parsed = JSON.parse(e.target.value);
                                            if (Array.isArray(parsed)) {
                                                setRules(parsed);
                                            }
                                        } catch {
                                            // Silently ignore invalid JSON, but a visual warning could be added in a production app
                                        }
                                    }}
                                />
                            ) : (
                                <p className="text-center text-gray-500 italic mt-16 text-lg">No rules added yet. Use the builder to start!</p>
                            )}
                        </div>
                    </div>
                )}

                {/* === Priorities Tab === */}
                {tab === 'priorities' && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Prioritization & Weights</h1>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            {Object.keys(weights).map((k) => (
                                <div key={k} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                                    <label className="block font-semibold text-gray-700 mb-3 text-lg">{k} ({weights[k as keyof Weights]})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={weights[k as keyof Weights]}
                                        onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                                        className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 mb-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
                            <h3 className="font-semibold text-gray-700 mb-4 text-xl">Apply Presets</h3>
                            <div className="flex flex-wrap gap-3">
                                {Object.keys(presetProfiles).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPreset(p)}
                                        className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-medium text-base hover:bg-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={exportAll}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                            >
                                <Download className="w-6 h-6 mr-3" /> Export All (ZIP)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}