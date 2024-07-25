import { Contract } from '@ethersproject/contracts';
import { Artifact } from 'hardhat/types';
/**
 * @dev Returns the task id and contract name for a canonical contract deployed on a specific network.
 * Throws if the address doesn't match any known Balancer deployment.
 * @param address Address of the contract to be fetched
 * @param network Name of the network looking the deployment for (e.g. mainnet,  polygon, goerli, etc)
 */
export declare function lookupBalancerContractByAddress(address: string, network: string): {
    task: string;
    name: string;
};
/**
 * @dev Creates an ethers Contract object for a canonical contract deployed on a specific network
 * @param task ID of the task to fetch the deployed contract
 * @param contract Name of the contract to be fetched
 * @param network Name of the network looking the deployment for (e.g. mainnet, polygon, goerli, etc)
 */
export declare function getBalancerContract(task: string, contract: string, network: string): Promise<Contract>;
/**
 * @dev Creates an ethers Contract object from a dynamically created contract at a known address
 * @param task ID of the task to fetch the deployed contract
 * @param contract Name of the contract to be fetched
 * @param address Address of the contract to be fetched
 */
export declare function getBalancerContractAt(task: string, contract: string, address: string): Promise<Contract>;
/**
 * @dev Returns the contract's artifact from a specific task
 * @param task ID of the task to look the ABI of the required contract
 * @param contract Name of the contract to looking the ABI of
 */
export declare function getBalancerContractArtifact(task: string, contract: string): Artifact;
/**
 * @dev Returns the ABI for a contract from a specific task
 * @param task ID of the task to look the ABI of the required contract
 * @param contract Name of the contract to be fetched.
 */
export declare function getBalancerContractAbi(task: string, contract: string): any[];
/**
 * @deprecated
 * @dev Returns the contract's creation code of for a specific task
 * @param task ID of the task to look the creation code of the required contract
 * @param contract Name of the contract to looking the creation code of
 */
export declare function getBalancerContractBytecode(task: string, contract: string): string;
/**
 * @dev Returns the contract address of a deployed contract for a specific task on a network
 * @param task ID of the task looking the deployment for
 * @param contract Name of the contract to fetched the address of
 * @param network Name of the network looking the deployment for (e.g. mainnet, polygon, goerli, etc)
 */
export declare function getBalancerContractAddress(task: string, contract: string, network: string): string;
/**
 * @dev Returns the deployment output for a specific task on a network
 * @param task ID of the task to look the deployment output of the required network
 * @param network Name of the network looking the deployment output for (e.g. mainnet, polygon, goerli, etc)
 */
export declare function getBalancerDeployment(task: string, network: string): {
    [key: string]: string;
};
