import Task from './task';
import { Network } from './types';
export declare function saveContractDeploymentTransactionHash(deployedAddress: string, deploymentTransactionHash: string, network: Network): void;
export declare function getContractDeploymentTransactionHash(deployedAddress: string, network: Network): string;
/**
 * Saves a file with the canonical deployment addresses for all tasks in a given network.
 */
export declare function saveContractDeploymentAddresses(tasks: Task[], network: string): void;
/**
 * Builds an object that maps task IDs to deployment info for all given tasks.
 * The resulting format reads as follows:
 * <task-id>: {
 *   contracts: [
 *     {
 *       name: <contract-name>,
 *       address: <deployment-address>
 *     },
 *     (...)
 *   ],
 *   status: <ACTIVE | DEPRECATED | SCRIPT>
 * },
 * (...)
 */
export declare function buildContractDeploymentAddressesEntries(tasks: Task[]): object;
/**
 * Returns true if the existing deployment addresses file stored in `CONTRACT_ADDRESSES_DIRECTORY` matches the
 * canonical one for the given network; false otherwise.
 */
export declare function checkContractDeploymentAddresses(tasks: Task[], network: string): boolean;
/**
 * Builds and saves the timelock authorizer config JSON file, containing grant and execution delays.
 * It is based on the input configuration in the deployment task for the given network.
 */
export declare function saveTimelockAuthorizerConfig(task: Task, network: string): Promise<void>;
/**
 * Returns true if the config file in `TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY` has the right configuration for the
 * network, and false otherwise.
 * If the timelock authorizer is not deployed for a given network, the file should not exist.
 * If the timelock authorizer is deployed for a given network, the file should exist and not be empty.
 */
export declare function checkTimelockAuthorizerConfig(task: Task, network: string): boolean;
export declare function getTimelockAuthorizerConfigDiff(task: Task, network: string): Promise<any[]>;
export declare function withRetries(f: () => Promise<void>): Promise<void>;
