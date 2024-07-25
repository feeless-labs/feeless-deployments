"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalancerDeployment = exports.getBalancerContractAddress = exports.getBalancerContractBytecode = exports.getBalancerContractAbi = exports.getBalancerContractArtifact = exports.getBalancerContractAt = exports.getBalancerContract = exports.lookupBalancerContractByAddress = void 0;
const contracts_1 = require("@ethersproject/contracts");
/**
 * @dev Returns the task id and contract name for a canonical contract deployed on a specific network.
 * Throws if the address doesn't match any known Balancer deployment.
 * @param address Address of the contract to be fetched
 * @param network Name of the network looking the deployment for (e.g. mainnet,  polygon, goerli, etc)
 */
function lookupBalancerContractByAddress(address, network) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const networkAddresses = require(getBalancerContractAddresses(network));
    const deploymentInfo = networkAddresses[address];
    if (deploymentInfo === undefined) {
        throw new Error(`Unable to connect ${address} to any Balancer deployment on ${network}`);
    }
    return deploymentInfo;
}
exports.lookupBalancerContractByAddress = lookupBalancerContractByAddress;
/**
 * @dev Creates an ethers Contract object for a canonical contract deployed on a specific network
 * @param task ID of the task to fetch the deployed contract
 * @param contract Name of the contract to be fetched
 * @param network Name of the network looking the deployment for (e.g. mainnet, polygon, goerli, etc)
 */
async function getBalancerContract(task, contract, network) {
    const address = await getBalancerContractAddress(task, contract, network);
    return getBalancerContractAt(task, contract, address);
}
exports.getBalancerContract = getBalancerContract;
/**
 * @dev Creates an ethers Contract object from a dynamically created contract at a known address
 * @param task ID of the task to fetch the deployed contract
 * @param contract Name of the contract to be fetched
 * @param address Address of the contract to be fetched
 */
async function getBalancerContractAt(task, contract, address) {
    const artifact = getBalancerContractArtifact(task, contract);
    return new contracts_1.Contract(address, artifact.abi);
}
exports.getBalancerContractAt = getBalancerContractAt;
/**
 * @dev Returns the contract's artifact from a specific task
 * @param task ID of the task to look the ABI of the required contract
 * @param contract Name of the contract to looking the ABI of
 */
function getBalancerContractArtifact(task, contract) {
    return require(getBalancerContractArtifactPath(task, contract));
}
exports.getBalancerContractArtifact = getBalancerContractArtifact;
/**
 * @dev Returns the ABI for a contract from a specific task
 * @param task ID of the task to look the ABI of the required contract
 * @param contract Name of the contract to be fetched.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBalancerContractAbi(task, contract) {
    const artifact = getBalancerContractArtifact(task, contract);
    return artifact.abi;
}
exports.getBalancerContractAbi = getBalancerContractAbi;
/**
 * @deprecated
 * @dev Returns the contract's creation code of for a specific task
 * @param task ID of the task to look the creation code of the required contract
 * @param contract Name of the contract to looking the creation code of
 */
function getBalancerContractBytecode(task, contract) {
    const artifact = getBalancerContractArtifact(task, contract);
    return artifact.bytecode;
}
exports.getBalancerContractBytecode = getBalancerContractBytecode;
/**
 * @dev Returns the contract address of a deployed contract for a specific task on a network
 * @param task ID of the task looking the deployment for
 * @param contract Name of the contract to fetched the address of
 * @param network Name of the network looking the deployment for (e.g. mainnet, polygon, goerli, etc)
 */
function getBalancerContractAddress(task, contract, network) {
    const output = getBalancerDeployment(task, network);
    return output[contract];
}
exports.getBalancerContractAddress = getBalancerContractAddress;
/**
 * @dev Returns the deployment output for a specific task on a network
 * @param task ID of the task to look the deployment output of the required network
 * @param network Name of the network looking the deployment output for (e.g. mainnet, polygon, goerli, etc)
 */
function getBalancerDeployment(task, network) {
    return require(getBalancerDeploymentPath(task, network));
}
exports.getBalancerDeployment = getBalancerDeployment;
/**
 * @dev Returns the path of a contract's artifact from a specific task
 * @param task ID of the task to look the path of the artifact the required contract
 * @param contract Name of the contract to look the path of it's creation code
 */
function getBalancerContractArtifactPath(task, contract) {
    return `@balancer-labs/v2-deployments/dist/tasks/${task}/artifact/${contract}.json`;
}
/**
 * @dev Returns the deployment path for a specific task on a network
 * @param task ID of the task to look the deployment path for the required network
 * @param network Name of the network looking the deployment path for (e.g. mainnet, polygon, goerli, etc)
 */
function getBalancerDeploymentPath(task, network) {
    return `@balancer-labs/v2-deployments/dist/tasks/${task}/output/${network}.json`;
}
/**
 * @dev Returns the path for the list of Balancer contract addresses on a network
 * @param network Name of the network looking the deployment path for (e.g. mainnet, polygon, goerli, etc)
 */
function getBalancerContractAddresses(network) {
    return `@balancer-labs/v2-deployments/dist/addresses/${network}.json`;
}
