import { Task, TaskRunOptions } from '@src';
import { RoleData } from './input/types';
declare const _default: (task: Task, { force, from }?: TaskRunOptions) => Promise<void>;
export default _default;
/**
 * Gets permissions granted to the old authorizer between two given blocks.
 * @param network Target chain name.
 * @param fromBlock Starting block; permissions granted before it will be filtered out.
 * @param toBlock End block; permissions granted after it will be filtered out.
 * @returns Promise of array with role data containing granted permissions.
 */
export declare function getTransitionRoles(network: string, fromBlock: number, toBlock: number): Promise<RoleData[]>;
