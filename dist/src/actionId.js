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
exports.fetchTheGraphPermissions = exports.getActionIdInfo = exports.getActionIds = exports.checkActionIdUniqueness = exports.checkActionIds = exports.saveActionIds = exports.getTaskActionIds = exports.ACTION_ID_DIRECTORY = void 0;
const abi_1 = require("@ethersproject/abi");
const fs_1 = __importDefault(require("fs"));
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const graphql_request_1 = require("graphql-request");
const task_1 = __importStar(require("./task"));
exports.ACTION_ID_DIRECTORY = path_1.default.join(__dirname, '../action-ids');
function safeReadJsonFile(filePath) {
    const fileExists = fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
    return fileExists ? JSON.parse(fs_1.default.readFileSync(filePath).toString()) : {};
}
function getTaskActionIds(task) {
    const filePath = path_1.default.join(exports.ACTION_ID_DIRECTORY, task.network, 'action-ids.json');
    const actionIdFileContents = safeReadJsonFile(filePath);
    return actionIdFileContents[task.id];
}
exports.getTaskActionIds = getTaskActionIds;
async function saveActionIds(task, contractName, factoryOutput) {
    var _a;
    logger_1.default.log(`Generating action IDs for ${contractName} of ${task.id}`, '');
    const { useAdaptor, actionIds } = await getActionIds(task, contractName, factoryOutput);
    const actionIdsDir = path_1.default.join(exports.ACTION_ID_DIRECTORY, task.network);
    if (!fs_1.default.existsSync(actionIdsDir))
        fs_1.default.mkdirSync(actionIdsDir, { recursive: true });
    const filePath = path_1.default.join(actionIdsDir, 'action-ids.json');
    // Load the existing content if any exists.
    const newFileContents = safeReadJsonFile(filePath);
    // Write the new entry.
    newFileContents[task.id] = (_a = newFileContents[task.id]) !== null && _a !== void 0 ? _a : {};
    newFileContents[task.id][contractName] = { useAdaptor, factoryOutput, actionIds };
    fs_1.default.writeFileSync(filePath, JSON.stringify(newFileContents, null, 2));
}
exports.saveActionIds = saveActionIds;
async function checkActionIds(task) {
    const taskActionIdData = getTaskActionIds(task);
    if (taskActionIdData === undefined)
        return;
    for (const [contractName, actionIdData] of Object.entries(taskActionIdData)) {
        const { useAdaptor: expectedUseAdaptor, actionIds: expectedActionIds } = await getActionIds(task, contractName, actionIdData.factoryOutput);
        const adaptorUsageMatch = actionIdData.useAdaptor === expectedUseAdaptor;
        const actionIdsMatch = Object.entries(expectedActionIds).every(([signature, expectedActionId]) => actionIdData.actionIds[signature] === expectedActionId);
        if (adaptorUsageMatch && actionIdsMatch) {
            logger_1.default.success(`Verified recorded action IDs of contract '${contractName}' of task '${task.id}'`);
        }
        else {
            throw Error(`The recorded action IDs for '${contractName}' of task '${task.id}' does not match those calculated from onchain`);
        }
    }
}
exports.checkActionIds = checkActionIds;
function checkActionIdUniqueness(network) {
    const actionIdsDir = path_1.default.join(exports.ACTION_ID_DIRECTORY, network);
    const filePath = path_1.default.join(actionIdsDir, 'action-ids.json');
    const actionIdFileContents = safeReadJsonFile(filePath);
    const duplicateActionIdsMapping = getDuplicateActionIds(actionIdFileContents);
    const expectedCollisionsFilePath = path_1.default.join(actionIdsDir, 'expected-collisions.json');
    const expectedDuplicateActionIdsMapping = safeReadJsonFile(expectedCollisionsFilePath);
    if (JSON.stringify(duplicateActionIdsMapping) === JSON.stringify(expectedDuplicateActionIdsMapping)) {
        logger_1.default.success(`Verified that no contracts unexpectedly share action IDs for ${network}`);
    }
    else {
        for (const [actionId, instances] of Object.entries(duplicateActionIdsMapping)) {
            if (JSON.stringify(instances) === JSON.stringify(expectedDuplicateActionIdsMapping[actionId])) {
                // We expect some collisions of actionIds for cases where contracts share the same signature,
                // such as those using the AuthorizerAdaptor. If the collisions *exactly* match those in the
                // expected list, we can ignore them.
                continue;
            }
            // If there are unexpected collisions while running `save-action-ids`, this will generate detailed
            // warning messages. Follow the instructions below to update the `expected-collisions` file.
            logger_1.default.warn(`${instances.length} contracts share the action ID: ${actionId}`);
            for (const [index, actionIdInfo] of instances.entries()) {
                const prefix = `  ${index + 1}: ${actionIdInfo.contractName}::${actionIdInfo.signature}`;
                logger_1.default.warn(`${(0, lodash_1.padEnd)(prefix, 100)}(${actionIdInfo.taskId})`);
            }
        }
        // Write a file called `updated-expected-collisions`, with new entries added to resolve the warnings.
        //
        // If there is no `expected-collisions` file for this network, simply review the new file to ensure the
        // additions are valid, then rename `updated-expected-collisions` to `expected-collisions`.
        // If there is already an`expected-collisions` file, check the diff, then replace the old file with this one.
        //
        // Never make manual changes to the `expected-collisions` file, as this might result in "unsorted"
        // entries that cause `save-action-ids` to fail with no warnings.
        //
        // After renaming or replacing the collisions file, running `save-action-ids` again should
        // produce no warnings.
        fs_1.default.writeFileSync(path_1.default.join(actionIdsDir, 'updated-expected-collisions.json'), JSON.stringify(duplicateActionIdsMapping, null, 2));
        throw Error(`There exist two duplicated action IDs across two separate contracts`);
    }
}
exports.checkActionIdUniqueness = checkActionIdUniqueness;
async function getActionIds(task, contractName, factoryOutput) {
    const artifact = task.artifact(contractName);
    const { ignoredFunctions } = safeReadJsonFile(path_1.default.join(exports.ACTION_ID_DIRECTORY, 'ignored-functions.json'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contractInterface = new abi_1.Interface(artifact.abi);
    const contractFunctions = Object.entries(contractInterface.functions)
        .filter(([, func]) => ['nonpayable', 'payable'].includes(func.stateMutability))
        .filter(([, func]) => !ignoredFunctions.includes(func.format()))
        .sort(([sigA], [sigB]) => (sigA < sigB ? -1 : 1)); // Sort functions alphabetically.
    const { useAdaptor, actionIdSource } = await getActionIdSource(task, contractName, factoryOutput);
    const actionIds = await getActionIdsFromSource(contractFunctions, actionIdSource);
    return { useAdaptor, actionIds };
}
exports.getActionIds = getActionIds;
async function getActionIdSource(task, contractName, factoryOutput) {
    const artifact = task.artifact(contractName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contractInterface = new abi_1.Interface(artifact.abi);
    // Not all contracts use the Authorizer directly for authentication.
    // Only if it has the `getActionId` function does it use the Authorizer directly.
    // Contracts without this function either are permissionless or use another method such as the AuthorizerAdaptor.
    const contractIsAuthorizerAware = Object.values(contractInterface.functions).some((func) => func.name === 'getActionId');
    if (contractIsAuthorizerAware) {
        if (factoryOutput) {
            await checkFactoryOutput(task, contractName, factoryOutput);
            return { useAdaptor: false, actionIdSource: await task.instanceAt(contractName, factoryOutput) };
        }
        else {
            return { useAdaptor: false, actionIdSource: await task.deployedInstance(contractName) };
        }
    }
    else {
        const adaptorTask = new task_1.default('20220325-authorizer-adaptor', task_1.TaskMode.READ_ONLY, task.network);
        return { useAdaptor: true, actionIdSource: await adaptorTask.deployedInstance('AuthorizerAdaptor') };
    }
}
async function getActionIdsFromSource(contractFunctions, actionIdSource) {
    const functionActionIds = await Promise.all(contractFunctions.map(async ([signature, contractFunction]) => {
        const functionSelector = abi_1.Interface.getSighash(contractFunction);
        return [signature, await actionIdSource.getActionId(functionSelector)];
    }));
    return Object.fromEntries(functionActionIds);
}
function getDuplicateActionIds(actionIdFileContents) {
    // Reverse the mapping of `contractName -> signature -> actionId` to be `actionId -> [contractName, signature][]`.
    // This simplifies checking for duplicate actionIds to just reading the length of the arrays.
    const actionIdsMapping = Object.entries(actionIdFileContents)
        .flatMap(([taskId, taskData]) => Object.entries(taskData).flatMap(([contractName, contractData]) => Object.entries(contractData.actionIds).map(([signature, actionId]) => [
        actionId,
        { taskId, contractName, signature, useAdaptor: contractData.useAdaptor },
    ])))
        .reduce((acc, [actionId, actionIdInfo]) => {
        var _a;
        acc[actionId] = (_a = acc[actionId]) !== null && _a !== void 0 ? _a : [];
        acc[actionId].push(actionIdInfo);
        return acc;
    }, {});
    const duplicateActionIdsMapping = Object.fromEntries(Object.entries(actionIdsMapping).filter(([, instances]) => instances.length > 1));
    return duplicateActionIdsMapping;
}
async function checkFactoryOutput(task, contractName, factoryOutput) {
    // We must check that the factory output is actually an instance of the expected contract type. This is
    // not trivial due to usage of immutable and lack of knowledge of constructor arguments. However, this scenario
    // only arises with Pools created from factories, all of which share a useful property: their factory contract
    // name is <contractName>Factory, and they all have a function called 'isPoolFromFactory' we can use for this.
    const factory = await task.deployedInstance(`${contractName}Factory`);
    if (!(await factory.isPoolFromFactory(factoryOutput))) {
        throw Error(`The contract at ${factoryOutput} is not an instance of a ${contractName}`);
    }
}
/** Returns full info for a given actionId and network */
function getActionIdInfo(actionId, network) {
    // read network JSON file from action-ids dir
    const tasks = safeReadJsonFile(path_1.default.join(exports.ACTION_ID_DIRECTORY, network, 'action-ids.json'));
    // filter all the entries which have the same actionId
    // and map them to an array of ActionIdInfo
    const entries = Object.entries(tasks)
        .filter(([, taskData]) => Object.values(taskData).some((contractData) => Object.entries(contractData.actionIds).some(([, hash]) => hash == actionId)))
        .map(([taskId, taskData]) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const contracts = Object.entries(taskData).filter(([, contractData]) => Object.entries(contractData.actionIds).some(([, hash]) => hash == actionId));
        return contracts.map(([contractName, contractData]) => ({
            taskId,
            contractName,
            useAdaptor: contractData.useAdaptor,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            signature: Object.entries(contractData.actionIds).find(([, hash]) => hash == actionId)[0],
            actionId,
        }));
    })
        .flat();
    // we return first entry because all the collisions are verified by scripts
    return entries[0];
}
exports.getActionIdInfo = getActionIdInfo;
async function fetchTheGraphPermissions(url) {
    const query = (0, graphql_request_1.gql) `
    query {
      permissions {
        id
        account
        action {
          id
        }
        txHash
      }
    }
  `;
    const data = await (0, graphql_request_1.request)(url, query);
    return data.permissions;
}
exports.fetchTheGraphPermissions = fetchTheGraphPermissions;
