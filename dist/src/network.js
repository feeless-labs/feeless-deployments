"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetries = exports.getTimelockAuthorizerConfigDiff = exports.checkTimelockAuthorizerConfig = exports.saveTimelockAuthorizerConfig = exports.checkContractDeploymentAddresses = exports.buildContractDeploymentAddressesEntries = exports.saveContractDeploymentAddresses = exports.getContractDeploymentTransactionHash = exports.saveContractDeploymentTransactionHash = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const task_1 = require("./task");
const actionId_1 = require("actionId");
const time_1 = require("@helpers/time");
const numbers_1 = require("@helpers/numbers");
const async_retry_1 = __importDefault(require("async-retry"));
const DEPLOYMENT_TXS_DIRECTORY = path_1.default.resolve(__dirname, '../deployment-txs');
const CONTRACT_ADDRESSES_DIRECTORY = path_1.default.resolve(__dirname, '../addresses');
const TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY = path_1.default.resolve(__dirname, '../timelock-authorizer-config');
function saveContractDeploymentTransactionHash(deployedAddress, deploymentTransactionHash, network) {
    if (network === 'hardhat')
        return;
    const filePath = path_1.default.join(DEPLOYMENT_TXS_DIRECTORY, `${network}.json`);
    const fileExists = fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
    // Load the existing content if any exists.
    const newFileContents = fileExists ? JSON.parse(fs_1.default.readFileSync(filePath).toString()) : {};
    // Write the new entry.
    newFileContents[deployedAddress] = deploymentTransactionHash;
    fs_1.default.writeFileSync(filePath, JSON.stringify(newFileContents, null, 2));
}
exports.saveContractDeploymentTransactionHash = saveContractDeploymentTransactionHash;
function getContractDeploymentTransactionHash(deployedAddress, network) {
    const filePath = path_1.default.join(DEPLOYMENT_TXS_DIRECTORY, `${network}.json`);
    const fileExists = fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
    if (!fileExists) {
        throw Error(`Could not find file for deployment transaction hashes for network '${network}'`);
    }
    const deploymentTxs = JSON.parse(fs_1.default.readFileSync(filePath).toString());
    const txHash = deploymentTxs[deployedAddress];
    if (txHash === undefined) {
        throw Error(`No transaction hash for contract ${deployedAddress} on network '${network}'`);
    }
    return txHash;
}
exports.getContractDeploymentTransactionHash = getContractDeploymentTransactionHash;
/**
 * Saves a file with the canonical deployment addresses for all tasks in a given network.
 */
function saveContractDeploymentAddresses(tasks, network) {
    if (network === 'hardhat')
        return;
    const allTaskEntries = buildContractDeploymentAddressesEntries(tasks);
    const filePath = path_1.default.join(CONTRACT_ADDRESSES_DIRECTORY, `${network}.json`);
    fs_1.default.writeFileSync(filePath, _stringifyEntries(allTaskEntries));
}
exports.saveContractDeploymentAddresses = saveContractDeploymentAddresses;
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
function buildContractDeploymentAddressesEntries(tasks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allTaskEntries = {};
    for (const task of tasks) {
        const taskEntries = Object.entries(task.output({ ensure: false }))
            .map(([name, address]) => [{ name, address }])
            .flat();
        // Some tasks do not have outputs for every network, so we just skip them.
        if (taskEntries.length == 0) {
            continue;
        }
        allTaskEntries = {
            ...allTaskEntries,
            [task.id]: {
                contracts: [...taskEntries],
                status: task_1.TaskStatus[task.getStatus()],
            },
        };
    }
    return allTaskEntries;
}
exports.buildContractDeploymentAddressesEntries = buildContractDeploymentAddressesEntries;
/**
 * Returns true if the existing deployment addresses file stored in `CONTRACT_ADDRESSES_DIRECTORY` matches the
 * canonical one for the given network; false otherwise.
 */
function checkContractDeploymentAddresses(tasks, network) {
    const allTaskEntries = buildContractDeploymentAddressesEntries(tasks);
    const filePath = path_1.default.join(CONTRACT_ADDRESSES_DIRECTORY, `${network}.json`);
    const fileExists = fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
    // Load the existing content if any exists.
    const existingFileContents = fileExists ? fs_1.default.readFileSync(filePath).toString() : '';
    return _stringifyEntries(allTaskEntries) === existingFileContents;
}
exports.checkContractDeploymentAddresses = checkContractDeploymentAddresses;
/**
 * Builds and saves the timelock authorizer config JSON file, containing grant and execution delays.
 * It is based on the input configuration in the deployment task for the given network.
 */
async function saveTimelockAuthorizerConfig(task, network) {
    const allDelays = _buildTimelockAuthorizerConfig(task, network);
    if (Object.keys(allDelays).length > 0) {
        const filePath = path_1.default.join(TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY, `${network}.json`);
        fs_1.default.writeFileSync(filePath, _stringifyEntries(allDelays));
    }
}
exports.saveTimelockAuthorizerConfig = saveTimelockAuthorizerConfig;
/**
 * Returns true if the config file in `TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY` has the right configuration for the
 * network, and false otherwise.
 * If the timelock authorizer is not deployed for a given network, the file should not exist.
 * If the timelock authorizer is deployed for a given network, the file should exist and not be empty.
 */
function checkTimelockAuthorizerConfig(task, network) {
    // Returns an empty object if there are no delays defined
    const allDelays = _buildTimelockAuthorizerConfig(task, network);
    const taskHasOutput = task.hasOutput();
    const filePath = path_1.default.join(TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY, `${network}.json`);
    const fileExists = fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
    // If the task has an output, there should be a file and vice-versa.
    // If the task has an output, the configuration cannot be empty.
    if (taskHasOutput !== fileExists || (taskHasOutput && Object.keys(allDelays).length === 0)) {
        return false;
    }
    // Load the existing content if any exists.
    const existingFileContents = fileExists ? fs_1.default.readFileSync(filePath).toString() : '{}';
    return _stringifyEntries(allDelays) === existingFileContents;
}
exports.checkTimelockAuthorizerConfig = checkTimelockAuthorizerConfig;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTimelockAuthorizerConfigDiff(task, network) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diff = [];
    if (!task.hasOutput()) {
        // If the contract is not deployed for this network, return early.
        return diff;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allDelays = _buildTimelockAuthorizerConfig(task, network);
    const timelockAuthorizer = await task.deployedInstance('TimelockAuthorizer');
    for (const delayInfo of allDelays.grantDelays) {
        const actionId = delayInfo.actionIdInfo.actionId;
        const onchainDelay = await timelockAuthorizer.getActionIdGrantDelay(actionId);
        if (!onchainDelay.eq((0, numbers_1.bn)(delayInfo.delay.value))) {
            diff.push({
                actionId: delayInfo.actionIdInfo,
                onchainDelay: (0, numbers_1.decimal)(onchainDelay),
                expectedDelay: delayInfo.delay.value,
                type: 'Grant',
            });
        }
    }
    for (const delayInfo of allDelays.executeDelays) {
        const actionId = delayInfo.actionIdInfo.actionId;
        const onchainDelay = await timelockAuthorizer.getActionIdDelay(actionId);
        if (!onchainDelay.eq((0, numbers_1.bn)(delayInfo.delay.value))) {
            diff.push({
                actionId: delayInfo.actionIdInfo,
                onchainDelay: (0, numbers_1.decimal)(onchainDelay),
                expectedDelay: delayInfo.delay.value,
                type: 'Execute',
            });
        }
    }
    return diff;
}
exports.getTimelockAuthorizerConfigDiff = getTimelockAuthorizerConfigDiff;
async function withRetries(f) {
    await (0, async_retry_1.default)(async () => f(), {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000,
        randomize: true, // Randomize the wait time
    });
}
exports.withRetries = withRetries;
/**
 * Builds an object that contains the information for Grant delays and Execute delays.
 * The resulting format reads as follows:
 * grantDelays: [
 *   {
 *     "actionIdInfo": {
 *       "taskId": "<task-name>",
 *       "contractName": "<contract-name>",
 *       "useAdaptor": <true | false>,
 *       "signature": "<function-signature>",
 *       "actionId": "<action-id-hash>"
 *     },
 *     "delay": {
 *       "label": "<human-readable-delay>",
 *       "value": <delay-in-seconds>
 *     }
 *   },
 * ],
 * executeDelays: [
 *  (...)
 * ]
 * (...)
 */
function _buildTimelockAuthorizerConfig(task, network) {
    var _a, _b;
    const settings = task.settings();
    const grantDelays = 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_a = settings.GrantDelays) === null || _a === void 0 ? void 0 : _a.map((grantDelay) => {
        return {
            actionIdInfo: (0, actionId_1.getActionIdInfo)(grantDelay.actionId, network),
            delay: {
                label: (0, time_1.timestampToString)(grantDelay.newDelay),
                value: grantDelay.newDelay,
            },
        };
    });
    const executeDelays = 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_b = settings.ExecuteDelays) === null || _b === void 0 ? void 0 : _b.map((executeDelay) => {
        return {
            actionIdInfo: (0, actionId_1.getActionIdInfo)(executeDelay.actionId, network),
            delay: {
                label: (0, time_1.timestampToString)(executeDelay.newDelay),
                value: executeDelay.newDelay,
            },
        };
    });
    if (grantDelays === undefined && executeDelays === undefined) {
        return {};
    }
    return {
        grantDelays,
        executeDelays,
    };
}
function _stringifyEntries(entries) {
    return JSON.stringify(entries, null, 2);
}
