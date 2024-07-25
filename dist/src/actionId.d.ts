import Task from './task';
export declare const ACTION_ID_DIRECTORY: string;
export type RoleData = {
    role: string;
    grantee: string;
    target: string;
};
export type ActionIdData = Record<string, string>;
export type TaskActionIds = Record<string, ContractActionIdData>;
export type ContractActionIdData = {
    useAdaptor: boolean;
    factoryOutput?: string;
    actionIds: ActionIdData;
};
export type ActionIdInfo = {
    taskId: string;
    contractName: string;
    signature: string;
    useAdaptor: boolean;
};
interface TheGraphPermissionEntry {
    id: string;
    account: string;
    action: {
        id: string;
    };
    txHash: string;
}
export declare function getTaskActionIds(task: Task): TaskActionIds;
export declare function saveActionIds(task: Task, contractName: string, factoryOutput?: string): Promise<void>;
export declare function checkActionIds(task: Task): Promise<void>;
export declare function checkActionIdUniqueness(network: string): void;
export declare function getActionIds(task: Task, contractName: string, factoryOutput?: string): Promise<{
    useAdaptor: boolean;
    actionIds: ActionIdData;
}>;
/** Returns full info for a given actionId and network */
export declare function getActionIdInfo(actionId: string, network: string): ActionIdInfo | undefined;
export declare function fetchTheGraphPermissions(url: string): Promise<TheGraphPermissionEntry[]>;
export {};
