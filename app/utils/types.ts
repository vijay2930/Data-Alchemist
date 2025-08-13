export type ValidationError = { rowIndex: number; field: string; message: string };

export type EntityType = 'clients' | 'workers' | 'tasks';
export type RuleType =
    | 'coRun'
    | 'slotRestriction'
    | 'loadLimit'
    | 'phaseWindow'
    | 'patternMatch'
    | 'precedenceOverride';

export type Rule =
    | { type: 'coRun'; tasks: string[] }
    | { type: 'slotRestriction'; group: string; minCommonSlots: number }
    | { type: 'loadLimit'; workerGroup: string; maxSlotsPerPhase: number }
    | { type: 'phaseWindow'; taskId: string; allowedPhases: number[] }
    | { type: 'patternMatch'; regex: string; template: string; params: Record<string, any> }
    | { type: 'precedenceOverride'; priorityOrder: string[] };

export interface Weights {
    clientPriority: number;
    fairness: number;
    fulfillment: number;
    idleTime: number;
    overloadAvoidance: number;
}

export const presetProfiles: Record<string, Weights> = {
    Balanced: { clientPriority: 50, fairness: 50, fulfillment: 50, idleTime: 50, overloadAvoidance: 50 },
    'Max Fulfillment': { clientPriority: 70, fairness: 40, fulfillment: 100, idleTime: 30, overloadAvoidance: 50 },
    'Light Workload': { clientPriority: 40, fairness: 60, fulfillment: 50, idleTime: 80, overloadAvoidance: 70 },
};