"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-vyper");
require("@nomiclabs/hardhat-waffle");
require("hardhat-local-networks-config-plugin");
require("hardhat-ignore-warnings");
require("tsconfig-paths/register");
require("./src/helpers/setupTests");
const config_1 = require("hardhat/config");
const task_names_1 = require("hardhat/builtin-tasks/task-names");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const artifact_1 = require("./src/artifact");
const test_1 = __importDefault(require("./src/test"));
const task_1 = __importStar(require("./src/task"));
const verifier_1 = __importDefault(require("./src/verifier"));
const logger_1 = __importStar(require("./src/logger"));
const actionId_1 = require("./src/actionId");
const network_1 = require("./src/network");
const THEGRAPHURLS = {
    goerli: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-authorizer-goerli',
};
(0, config_1.task)('deploy', 'Run deployment task')
    .addParam('id', 'Deployment task ID')
    .addFlag('force', 'Ignore previous deployments')
    .addOptionalParam('key', 'Etherscan API key to verify contracts')
    .setAction(async (args, hre) => {
    var _a;
    logger_1.Logger.setDefaults(false, args.verbose || false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKey = (_a = args.key) !== null && _a !== void 0 ? _a : hre.config.networks[hre.network.name].verificationAPIKey;
    const verifier = apiKey ? new verifier_1.default(hre.network, apiKey) : undefined;
    await new task_1.default(args.id, task_1.TaskMode.LIVE, hre.network.name, verifier).run(args);
});
(0, config_1.task)('verify-contract', `Verify a task's deployment on a block explorer`)
    .addParam('id', 'Deployment task ID')
    .addParam('name', 'Contract name')
    .addParam('address', 'Contract address')
    .addParam('args', 'ABI-encoded constructor arguments')
    .addOptionalParam('key', 'Etherscan API key to verify contracts')
    .setAction(async (args, hre) => {
    var _a;
    logger_1.Logger.setDefaults(false, args.verbose || false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKey = (_a = args.key) !== null && _a !== void 0 ? _a : hre.config.networks[hre.network.name].verificationAPIKey;
    const verifier = apiKey ? new verifier_1.default(hre.network, apiKey) : undefined;
    // Contracts can only be verified in Live mode
    await new task_1.default(args.id, task_1.TaskMode.LIVE, hre.network.name, verifier).verify(args.name, args.address, args.args);
});
(0, config_1.task)('extract-artifacts', `Extract contract artifacts from their build-info`)
    .addOptionalParam('id', 'Specific task ID')
    .addOptionalParam('file', 'Target build-info file name')
    .addOptionalParam('name', 'Contract name')
    .setAction(async (args) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (args.id) {
        const task = new task_1.default(args.id, task_1.TaskMode.READ_ONLY);
        (0, artifact_1.extractArtifact)(task, args.file, args.name);
    }
    else {
        for (const taskID of task_1.default.getAllTaskIds()) {
            const task = new task_1.default(taskID, task_1.TaskMode.READ_ONLY);
            (0, artifact_1.extractArtifact)(task, args.file, args.name);
        }
    }
});
(0, config_1.task)('check-deployments', `Check that all tasks' deployments correspond to their build-info and inputs`)
    .addOptionalParam('id', 'Specific task ID')
    .setAction(async (args, hre) => {
    // The force argument above is actually not passed (and not required or used in CHECK mode), but it is the easiest
    // way to address type issues.
    logger_1.Logger.setDefaults(false, args.verbose || false);
    logger_1.default.log(`Checking deployments for ${hre.network.name}...`, '');
    if (args.id) {
        await new task_1.default(args.id, task_1.TaskMode.CHECK, hre.network.name).run(args);
    }
    else {
        for (const taskID of task_1.default.getAllTaskIds()) {
            if (taskID.startsWith('00000000-')) {
                continue;
            }
            const task = new task_1.default(taskID, task_1.TaskMode.CHECK, hre.network.name);
            const outputDir = path_1.default.resolve(task.dir(), 'output');
            if ((0, fs_1.existsSync)(outputDir) && (0, fs_1.statSync)(outputDir).isDirectory()) {
                const outputFiles = (0, fs_1.readdirSync)(outputDir);
                if (outputFiles.some((outputFile) => outputFile.includes(hre.network.name))) {
                    // Not all tasks have outputs for all networks, so we skip those that don't
                    await (0, network_1.withRetries)(async () => task.run(args));
                }
            }
        }
    }
});
(0, config_1.task)('check-artifacts', `check that contract artifacts correspond to their build-info`)
    .addOptionalParam('id', 'Specific task ID')
    .setAction(async (args) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (args.id) {
        const task = new task_1.default(args.id, task_1.TaskMode.READ_ONLY);
        (0, artifact_1.checkArtifact)(task);
    }
    else {
        for (const taskID of task_1.default.getAllTaskIds()) {
            const task = new task_1.default(taskID, task_1.TaskMode.READ_ONLY);
            (0, artifact_1.checkArtifact)(task);
        }
    }
});
(0, config_1.task)('save-action-ids', `Print the action IDs for a particular contract and checks their uniqueness`)
    .addOptionalParam('id', 'Specific task ID')
    .addOptionalParam('name', 'Contract name')
    .addOptionalParam('address', 'Address of Pool created from a factory')
    .setAction(async (args, hre) => {
    async function saveActionIdsTask(args, hre) {
        logger_1.Logger.setDefaults(false, args.verbose || false);
        // The user is calculating action IDs for a contract which isn't included in the task outputs.
        // Most likely this is for a pool which is to be deployed from a factory contract deployed as part of the task.
        if (args.address) {
            if (!args.id || !args.name) {
                throw new Error("Provided an address for Pool created from a factory but didn't specify task or contract name.");
            }
            const task = new task_1.default(args.id, task_1.TaskMode.READ_ONLY, hre.network.name);
            await (0, actionId_1.saveActionIds)(task, args.name, args.address);
            return;
        }
        // The user is calculating the action IDs for a particular task or contract within a particular task.
        if (args.id && args.name) {
            const task = new task_1.default(args.id, task_1.TaskMode.READ_ONLY, hre.network.name);
            await (0, actionId_1.saveActionIds)(task, args.name);
            return;
        }
        async function generateActionIdsForTask(taskId) {
            const task = new task_1.default(taskId, task_1.TaskMode.READ_ONLY, hre.network.name);
            const outputDir = path_1.default.resolve(task.dir(), 'output');
            if ((0, fs_1.existsSync)(outputDir) && (0, fs_1.statSync)(outputDir).isDirectory()) {
                for (const outputFile of (0, fs_1.readdirSync)(outputDir)) {
                    const outputFilePath = path_1.default.resolve(outputDir, outputFile);
                    if (outputFile.includes(hre.network.name) && (0, fs_1.statSync)(outputFilePath).isFile()) {
                        const fileContents = JSON.parse((0, fs_1.readFileSync)(outputFilePath).toString());
                        const contractNames = Object.keys(fileContents);
                        for (const contractName of contractNames) {
                            await (0, actionId_1.saveActionIds)(task, contractName);
                        }
                    }
                }
            }
        }
        if (args.id) {
            await generateActionIdsForTask(args.id);
            return;
        }
        // We're calculating action IDs for whichever contracts we can pull enough information from disk for.
        // This will calculate action IDs for any contracts which are a named output from a task.
        for (const taskID of task_1.default.getAllTaskIds()) {
            await generateActionIdsForTask(taskID);
        }
    }
    await saveActionIdsTask(args, hre);
    (0, actionId_1.checkActionIdUniqueness)(hre.network.name);
});
(0, config_1.task)('check-action-ids', `Check that contract action-ids correspond the expected values`)
    .addOptionalParam('id', 'Specific task ID')
    .setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    logger_1.default.log(`Checking action IDs for ${hre.network.name}...`, '');
    if (args.id) {
        const task = new task_1.default(args.id, task_1.TaskMode.READ_ONLY, hre.network.name);
        await (0, actionId_1.checkActionIds)(task);
    }
    else {
        for (const taskID of task_1.default.getAllTaskIds()) {
            const task = new task_1.default(taskID, task_1.TaskMode.READ_ONLY, hre.network.name);
            await (0, network_1.withRetries)(async () => (0, actionId_1.checkActionIds)(task));
        }
    }
    (0, actionId_1.checkActionIdUniqueness)(hre.network.name);
});
(0, config_1.task)('get-action-id-info', `Returns all the matches for the given actionId`)
    .addPositionalParam('id', 'ActionId to use for the lookup')
    .setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    logger_1.default.info(`Looking for action ID info on ${hre.network.name}...`);
    const actionIdInfo = await (0, actionId_1.getActionIdInfo)(args.id, hre.network.name);
    if (actionIdInfo) {
        logger_1.default.log(`Found the following matches:`, '');
        logger_1.default.log(JSON.stringify(actionIdInfo, null, 2), '');
    }
    else {
        logger_1.default.log(`No entries found for the actionId`, '');
    }
});
(0, config_1.task)('get-action-ids-info', `Reconstructs all the permissions from TheGraph AP and action-ids files`).setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    logger_1.default.log(`Fetching permissions using TheGraph API on ${hre.network.name}...`, '');
    const permissions = await (0, actionId_1.fetchTheGraphPermissions)(THEGRAPHURLS[hre.network.name]);
    const infos = (await Promise.all(permissions.map((permission) => (0, actionId_1.getActionIdInfo)(permission.action.id, hre.network.name)))).map((info, index) => ({
        ...info,
        grantee: permissions[index].account,
        actionId: permissions[index].action.id,
        txHash: permissions[index].txHash,
    }));
    logger_1.default.log(`Found the following matches:`, '');
    process.stdout.write(JSON.stringify(infos, null, 2));
});
(0, config_1.task)('build-address-lookup', `Build a lookup table from contract addresses to the relevant deployment`).setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (hre.network.name === 'hardhat') {
        logger_1.default.warn(`invalid network: ${hre.network.name}`);
        return;
    }
    // Create Task objects, excluding tokens tasks.
    const tasks = task_1.default.getAllTaskIds()
        .filter((taskId) => !taskId.startsWith('00000000-'))
        .map((taskId) => new task_1.default(taskId, task_1.TaskMode.READ_ONLY, hre.network.name));
    (0, network_1.saveContractDeploymentAddresses)(tasks, hre.network.name);
    logger_1.default.success(`Address lookup generated for network ${hre.network.name}`);
});
(0, config_1.task)('check-address-lookup', `Check whether the existing lookup table from contract addresses to the relevant deployments is correct`).setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (hre.network.name === 'hardhat') {
        logger_1.default.warn(`invalid network: ${hre.network.name}`);
        return;
    }
    // Create Task objects, excluding tokens tasks.
    const tasks = task_1.default.getAllTaskIds()
        .filter((taskId) => !taskId.startsWith('00000000-'))
        .map((taskId) => new task_1.default(taskId, task_1.TaskMode.READ_ONLY, hre.network.name));
    const addressLookupFileOk = (0, network_1.checkContractDeploymentAddresses)(tasks, hre.network.name);
    if (!addressLookupFileOk) {
        throw new Error(`Address lookup file is incorrect for network ${hre.network.name}. Please run 'build-address-lookup' to regenerate it`);
    }
    else {
        logger_1.default.success(`Address lookup file is correct for network ${hre.network.name}`);
    }
});
(0, config_1.task)('build-timelock-authorizer-config', `Builds JSON file with Timelock Authorizer configuration`).setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (hre.network.name === 'hardhat') {
        logger_1.default.warn(`invalid network: ${hre.network.name}`);
        return;
    }
    // Get active timelock authorizer task.
    const tasks = task_1.default.getAllTaskIds()
        .filter((taskId) => taskId.includes('timelock-authorizer'))
        .map((taskId) => new task_1.default(taskId, task_1.TaskMode.READ_ONLY, hre.network.name))
        .filter((task) => task.getStatus() === task_1.TaskStatus.ACTIVE);
    if (tasks.length !== 1) {
        const errorMsg = tasks.length === 0 ? 'not found' : 'is not unique';
        logger_1.default.error(`Active timelock authorizer task ${errorMsg}`);
        return;
    }
    (0, network_1.saveTimelockAuthorizerConfig)(tasks[0], hre.network.name);
    logger_1.default.success(`Timelock Authorizer config JSON generated for network ${hre.network.name}`);
});
(0, config_1.task)('check-timelock-authorizer-config', `Check whether the existing timelock authorizer configuration file is correct`).setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (hre.network.name === 'hardhat') {
        logger_1.default.warn(`invalid network: ${hre.network.name}`);
        return;
    }
    // Get active timelock authorizer task.
    const tasks = task_1.default.getAllTaskIds()
        .filter((taskId) => taskId.includes('timelock-authorizer'))
        .map((taskId) => new task_1.default(taskId, task_1.TaskMode.READ_ONLY, hre.network.name))
        .filter((task) => task.getStatus() === task_1.TaskStatus.ACTIVE);
    if (tasks.length !== 1) {
        const errorMsg = tasks.length === 0 ? 'not found' : 'is not unique';
        logger_1.default.error(`Active timelock authorizer task ${errorMsg}`);
        return;
    }
    const isConfigOk = (0, network_1.checkTimelockAuthorizerConfig)(tasks[0], hre.network.name);
    if (isConfigOk) {
        logger_1.default.success(`Timelock Authorizer config JSON is correct for network ${hre.network.name}`);
    }
    else {
        throw new Error(`Timelock Authorizer config file is incorrect for network ${hre.network.name}. Please run 'build-timelock-authorizer-config' to regenerate it`);
    }
});
(0, config_1.task)('verify-timelock-authorizer-config', `Check whether the existing timelock authorizer configuration file matches the delays configured onchain`).setAction(async (args, hre) => {
    logger_1.Logger.setDefaults(false, args.verbose || false);
    if (hre.network.name === 'hardhat') {
        logger_1.default.warn(`invalid network: ${hre.network.name}`);
        return;
    }
    // Get active timelock authorizer task.
    const tasks = task_1.default.getAllTaskIds()
        .filter((taskId) => taskId.includes('timelock-authorizer'))
        .map((taskId) => new task_1.default(taskId, task_1.TaskMode.READ_ONLY, hre.network.name))
        .filter((task) => task.getStatus() === task_1.TaskStatus.ACTIVE);
    if (tasks.length !== 1) {
        const errorMsg = tasks.length === 0 ? 'not found' : 'is not unique';
        logger_1.default.error(`Active timelock authorizer task ${errorMsg}`);
        return;
    }
    const configDiff = await (0, network_1.getTimelockAuthorizerConfigDiff)(tasks[0], hre.network.name);
    if (configDiff.length === 0) {
        logger_1.default.success(`Timelock Authorizer config is correctly applied on-chain for network ${hre.network.name}`);
    }
    else {
        throw new Error(`Timelock Authorizer config file is incorrect for network ${hre.network.name}. Differences found:\n${JSON.stringify(configDiff, null, 2)}`);
    }
});
(0, config_1.task)(task_names_1.TASK_TEST).addOptionalParam('id', 'Specific task ID of the fork test to run.').setAction(test_1.default);
exports.default = {
    mocha: {
        timeout: 600000,
    },
    solidity: {
        version: '0.7.1',
        settings: {
            optimizer: {
                enabled: true,
                runs: 9999,
            },
        },
    },
    vyper: {
        compilers: [{ version: '0.3.1' }, { version: '0.3.3' }],
    },
    paths: {
        artifacts: './src/helpers/.hardhat/artifacts',
        cache: './src/helpers/.hardhat/cache',
        sources: './src/helpers/contracts',
    },
    warnings: {
        '*': {
            'shadowing-opcode': 'off',
            default: 'error',
        },
    },
    etherscan: {
        customChains: [
            {
                network: 'zkemv',
                chainId: 1101,
                urls: {
                    apiURL: 'https://api-zkevm.polygonscan.com/api',
                    browserURL: 'https://zkevm.polygonscan.com/',
                },
            },
            {
                network: 'base',
                chainId: 8453,
                urls: {
                    apiURL: 'https://api.basescan.org/api',
                    browserURL: 'https://basescan.org/',
                },
            },
            {
                network: 'fantom',
                chainId: 250,
                urls: {
                    apiURL: 'https://api.ftmscan.com/api',
                    browserURL: 'https://ftmscan.com',
                },
            },
        ],
    },
};
