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
exports.TaskStatus = exports.TaskMode = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importStar(require("path"));
const address_1 = require("@ethersproject/address");
const logger_1 = __importDefault(require("./logger"));
const contracts_1 = require("./contracts");
const types_1 = require("./types");
const network_1 = require("./network");
const actionId_1 = require("./actionId");
const artifact_1 = require("./artifact");
const TASKS_DIRECTORY = path_1.default.resolve(__dirname, '../tasks');
const DEPRECATED_DIRECTORY = path_1.default.join(TASKS_DIRECTORY, 'deprecated');
const SCRIPTS_DIRECTORY = path_1.default.join(TASKS_DIRECTORY, 'scripts');
var TaskMode;
(function (TaskMode) {
    TaskMode[TaskMode["LIVE"] = 0] = "LIVE";
    TaskMode[TaskMode["TEST"] = 1] = "TEST";
    TaskMode[TaskMode["CHECK"] = 2] = "CHECK";
    TaskMode[TaskMode["READ_ONLY"] = 3] = "READ_ONLY";
})(TaskMode = exports.TaskMode || (exports.TaskMode = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["ACTIVE"] = 0] = "ACTIVE";
    TaskStatus[TaskStatus["DEPRECATED"] = 1] = "DEPRECATED";
    TaskStatus[TaskStatus["SCRIPT"] = 2] = "SCRIPT";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
/* eslint-disable @typescript-eslint/no-var-requires */
class Task {
    constructor(idAlias, mode, network, verifier) {
        if (network && !types_1.NETWORKS.includes(network))
            throw Error(`Unknown network ${network}`);
        this.id = this._findTaskId(idAlias);
        this.mode = mode;
        this._network = network;
        this._verifier = verifier;
    }
    get network() {
        if (!this._network)
            throw Error('No network defined');
        return this._network;
    }
    set network(name) {
        this._network = name;
    }
    async instanceAt(name, address) {
        return (0, contracts_1.instanceAt)(this.artifact(name), address);
    }
    async deployedInstance(name) {
        const address = this.output()[name];
        if (!address)
            throw Error(`Could not find deployed address for ${name}`);
        return this.instanceAt(name, address);
    }
    async inputInstance(artifactName, inputName) {
        const rawInput = this.rawInput();
        const input = rawInput[inputName];
        if (!this._isTask(input))
            throw Error(`Cannot access to non-task input ${inputName}`);
        const task = input;
        task.network = this.network;
        const address = this._parseRawInput(rawInput)[inputName];
        return task.instanceAt(artifactName, address);
    }
    async deployAndVerify(name, args = [], from, force, libs) {
        if (this.mode == TaskMode.CHECK) {
            return await this.check(name, args, libs);
        }
        const instance = await this.deploy(name, args, from, force, libs);
        console.warn(instance.address);
        await this.verify(name, instance.address, args, libs);
        return instance;
    }
    async deploy(name, args = [], from, force, libs) {
        if (this.mode == TaskMode.CHECK) {
            return await this.check(name, args, libs);
        }
        if (this.mode !== TaskMode.LIVE && this.mode !== TaskMode.TEST) {
            throw Error(`Cannot deploy in tasks of mode ${TaskMode[this.mode]}`);
        }
        let instance;
        const output = this.output({ ensure: false });
        if (force || !output[name]) {
            instance = await (0, contracts_1.deploy)(this.artifact(name), args, from, libs);
            this.save({ [name]: instance });
            logger_1.default.success(`Deployed ${name} at ${instance.address}`);
            if (this.mode === TaskMode.LIVE) {
                (0, network_1.saveContractDeploymentTransactionHash)(instance.address, instance.deployTransaction.hash, this.network);
            }
        }
        else {
            logger_1.default.info(`${name} already deployed at ${output[name]}`);
            instance = await this.instanceAt(name, output[name]);
        }
        return instance;
    }
    async verify(name, address, constructorArguments, libs) {
        if (this.mode !== TaskMode.LIVE) {
            return;
        }
        try {
            if (!this._verifier)
                return logger_1.default.warn('Skipping contract verification, no verifier defined');
            const url = await this._verifier.call(this, name, address, constructorArguments, libs);
            logger_1.default.success(`Verified contract ${name} at ${url}`);
        }
        catch (error) {
            logger_1.default.error(`Failed trying to verify ${name} at ${address}: ${error}`);
        }
    }
    async check(name, args = [], libs) {
        // There are multiple approaches to checking that a deployed contract matches known source code. A naive approach
        // is to check for a match in the runtime code, but that doesn't account for actions taken during construction,
        // including calls, storage writes, and setting immutable state variables. Since immutable state variables modify
        // the runtime code, it can actually be quite tricky to produce matching runtime code.
        //
        // What we do instead is check for both runtime code and constructor execution (including constructor arguments) by
        // looking at the transaction in which the contract was deployed, which can be found in the /deployment-txs directory.
        // The data of this transaction will be the contract creation code followed by the abi-encoded constructor arguments,
        // which we can compare against what the task would attempt to deploy. In this way, we are testing the task's build
        // info, inputs and deployment code.
        //
        // The only thing we're not checking is what account deployed the contract, but our code does not have dependencies
        // on the deployer.
        const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
        const deployedAddress = this.output()[name];
        const deploymentTxHash = (0, network_1.getContractDeploymentTransactionHash)(deployedAddress, this.network);
        const deploymentTx = await ethers.provider.getTransaction(deploymentTxHash);
        const expectedDeploymentAddress = (0, address_1.getContractAddress)(deploymentTx);
        if (deployedAddress !== expectedDeploymentAddress) {
            throw Error(`The stated deployment address of '${name}' on network '${this.network}' of task '${this.id}' (${deployedAddress}) does not match the address which would be deployed by the transaction ${deploymentTxHash} (which instead deploys to ${expectedDeploymentAddress})`);
        }
        const expectedDeploymentTxData = await (0, contracts_1.deploymentTxData)(this.artifact(name), args, libs);
        if (deploymentTx.data === expectedDeploymentTxData) {
            logger_1.default.success(`Verified contract '${name}' on network '${this.network}' of task '${this.id}'`);
        }
        else {
            throw Error(`The build info and inputs for contract '${name}' on network '${this.network}' of task '${this.id}' does not match the data used to deploy address ${deployedAddress}`);
        }
        // We need to return an instance so that the task may carry on, potentially using this as input of future
        // deployments.
        return this.instanceAt(name, deployedAddress);
    }
    async run(options = {}) {
        const taskPath = this._fileAt(this.dir(), 'index.ts');
        const task = require(taskPath).default;
        await task(this, options);
    }
    dir() {
        if (!this.id)
            throw Error('Please provide a task deployment ID to run');
        // The task might be deprecated, so it may not exist in the main directory. We first look there, but don't require
        // that the directory exists.
        const nonDeprecatedDir = this._dirAt(TASKS_DIRECTORY, this.id, false);
        if (this._existsDir(nonDeprecatedDir)) {
            return nonDeprecatedDir;
        }
        const deprecatedDir = this._dirAt(DEPRECATED_DIRECTORY, this.id, false);
        if (this._existsDir(deprecatedDir)) {
            return deprecatedDir;
        }
        const scriptsDir = this._dirAt(SCRIPTS_DIRECTORY, this.id, false);
        if (this._existsDir(scriptsDir)) {
            return scriptsDir;
        }
        throw Error(`Could not find a directory at ${nonDeprecatedDir}, ${deprecatedDir} or ${scriptsDir}`);
    }
    buildInfo(fileName) {
        const buildInfoDir = this._dirAt(this.dir(), 'build-info');
        const artifactFile = this._fileAt(buildInfoDir, `${(0, path_1.extname)(fileName) ? fileName : `${fileName}.json`}`);
        return JSON.parse(fs_1.default.readFileSync(artifactFile).toString());
    }
    buildInfos() {
        const buildInfoDir = this._dirAt(this.dir(), 'build-info');
        return fs_1.default.readdirSync(buildInfoDir).map((fileName) => this.buildInfo(fileName));
    }
    artifact(contractName, fileName) {
        const buildInfoDir = this._dirAt(this.dir(), 'build-info');
        fileName = fileName !== null && fileName !== void 0 ? fileName : contractName;
        const builds = this._existsFile(path_1.default.join(buildInfoDir, `${fileName}.json`))
            ? this.buildInfo(fileName).output.contracts
            : this.buildInfos().reduce((result, info) => ({ ...result, ...info.output.contracts }), {});
        const sourceName = Object.keys(builds).find((sourceName) => Object.keys(builds[sourceName]).find((key) => key === contractName));
        if (!sourceName)
            throw Error(`Could not find artifact for ${contractName}`);
        return (0, artifact_1.getArtifactFromContractOutput)(sourceName, contractName, builds[sourceName][contractName]);
    }
    actionId(contractName, signature) {
        const taskActionIds = (0, actionId_1.getTaskActionIds)(this);
        if (taskActionIds === undefined)
            throw new Error('Could not find action IDs for task');
        const contractInfo = taskActionIds[contractName];
        if (contractInfo === undefined)
            throw new Error(`Could not find action IDs for contract ${contractName} on task ${this.id}`);
        const actionIds = taskActionIds[contractName].actionIds;
        if (actionIds[signature] === undefined)
            throw new Error(`Could not find function ${contractName}.${signature} on task ${this.id}`);
        return actionIds[signature];
    }
    rawInput() {
        return this._getDefaultExportForNetwork('input.ts');
    }
    input() {
        return this._parseRawInput(this.rawInput());
    }
    output({ ensure = true, network } = {}) {
        if (network === undefined) {
            network = this.mode !== TaskMode.TEST ? this.network : 'test';
        }
        const taskOutputDir = this._dirAt(this.dir(), 'output', ensure);
        const taskOutputFile = this._fileAt(taskOutputDir, `${network}.json`, ensure);
        return this._read(taskOutputFile);
    }
    settings() {
        return this._getDefaultExportForNetwork('settings.ts');
    }
    hasOutput() {
        let taskHasOutput = true;
        try {
            this.output();
        }
        catch {
            taskHasOutput = false;
        }
        return taskHasOutput;
    }
    save(rawOutput) {
        const output = this._parseRawOutput(rawOutput);
        if (this.mode === TaskMode.CHECK) {
            // `save` is only called by `deploy` (which only happens in LIVE and TEST modes), or manually for contracts that
            // are deployed by other contracts (e.g. Batch Relayer Entrypoints). Therefore, by testing for CHECK mode we can
            // identify this second type of contracts, and check them by comparing the saved address to the address that the
            // task would attempt to save.
            this._checkManuallySavedArtifacts(output);
        }
        else if (this.mode === TaskMode.LIVE || this.mode === TaskMode.TEST) {
            this._save(output);
        }
    }
    getStatus() {
        const taskDirectory = this.dir();
        if (taskDirectory === path_1.default.join(TASKS_DIRECTORY, this.id)) {
            return TaskStatus.ACTIVE;
        }
        else if (taskDirectory === path_1.default.join(DEPRECATED_DIRECTORY, this.id)) {
            return TaskStatus.DEPRECATED;
        }
        else if (taskDirectory === path_1.default.join(SCRIPTS_DIRECTORY, this.id)) {
            return TaskStatus.SCRIPT;
        }
        throw new Error('Unknown task status');
    }
    _getDefaultExportForNetwork(script) {
        const taskInputPath = this._fileAt(this.dir(), script);
        const rawInput = require(taskInputPath).default;
        const globalInput = { ...rawInput };
        types_1.NETWORKS.forEach((network) => delete globalInput[network]);
        const networkInput = rawInput[this.network] || {};
        return { ...globalInput, ...networkInput };
    }
    _checkManuallySavedArtifacts(output) {
        for (const name of Object.keys(output)) {
            const expectedAddress = this.output()[name];
            const actualAddress = output[name];
            if (actualAddress === expectedAddress) {
                logger_1.default.success(`Verified contract '${name}' on network '${this.network}' of task '${this.id}'`);
            }
            else {
                throw Error(`The stated deployment address of '${name}' on network '${this.network}' of task '${this.id}' (${actualAddress}) does not match the expected address (${expectedAddress})`);
            }
        }
    }
    _save(output) {
        const taskOutputDir = this._dirAt(this.dir(), 'output', false);
        if (!fs_1.default.existsSync(taskOutputDir))
            fs_1.default.mkdirSync(taskOutputDir);
        const outputFile = this.mode === TaskMode.LIVE ? `${this.network}.json` : 'test.json';
        const taskOutputFile = this._fileAt(taskOutputDir, outputFile, false);
        const previousOutput = this._read(taskOutputFile);
        const finalOutput = { ...previousOutput, ...output };
        this._write(taskOutputFile, finalOutput);
    }
    _parseRawInput(rawInput) {
        return Object.keys(rawInput).reduce((input, key) => {
            const item = rawInput[key];
            if (!this._isTask(item)) {
                // Non-task inputs are simply their value
                input[key] = item;
            }
            else {
                // For task inputs, we query the output file with the name of the key in the input object. For example, given
                // { 'BalancerHelpers': new Task('20210418-vault', TaskMode.READ_ONLY) }
                // the input value will be the output of name 'BalancerHelpers' of said task.
                const task = item;
                const output = task.output({ network: this.network });
                if (output[key] === undefined) {
                    throw Error(`No '${key}' value for task ${task.id} in output of network ${this.network}`);
                }
                input[key] = output[key];
            }
            return input;
        }, {});
    }
    _parseRawOutput(rawOutput) {
        return Object.keys(rawOutput).reduce((output, key) => {
            const value = rawOutput[key];
            output[key] = typeof value === 'string' ? value : value.address;
            return output;
        }, {});
    }
    _read(path) {
        return fs_1.default.existsSync(path) ? JSON.parse(fs_1.default.readFileSync(path).toString()) : {};
    }
    _write(path, output) {
        const finalOutputJSON = JSON.stringify(output, null, 2);
        fs_1.default.writeFileSync(path, finalOutputJSON);
    }
    _fileAt(base, name, ensure = true) {
        const filePath = path_1.default.join(base, name);
        if (ensure && !this._existsFile(filePath))
            throw Error(`Could not find a file at ${filePath}`);
        return filePath;
    }
    _dirAt(base, name, ensure = true) {
        const dirPath = path_1.default.join(base, name);
        if (ensure && !this._existsDir(dirPath))
            throw Error(`Could not find a directory at ${dirPath}`);
        return dirPath;
    }
    _existsFile(filePath) {
        return fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile();
    }
    _existsDir(dirPath) {
        return fs_1.default.existsSync(dirPath) && fs_1.default.statSync(dirPath).isDirectory();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _isTask(object) {
        return object.constructor.name == 'Task';
    }
    _findTaskId(idAlias) {
        const matches = Task.getAllTaskIds().filter((taskDirName) => taskDirName.includes(idAlias));
        if (matches.length == 1) {
            return matches[0];
        }
        else {
            if (matches.length == 0) {
                throw Error(`Found no matching directory for task alias '${idAlias}'`);
            }
            else {
                throw Error(`Multiple matching directories for task alias '${idAlias}', candidates are: \n${matches.join('\n')}`);
            }
        }
    }
    /**
     * Return all directories inside the top 3 fixed task directories in a flat, sorted array.
     */
    static getAllTaskIds() {
        // Some operating systems may insert hidden files that should not be listed, so we just look for directories when
        // reading the file system.
        return [TASKS_DIRECTORY, DEPRECATED_DIRECTORY, SCRIPTS_DIRECTORY]
            .map((dir) => fs_1.default.readdirSync(dir).filter((fileName) => fs_1.default.lstatSync(path_1.default.resolve(dir, fileName)).isDirectory()))
            .flat()
            .sort();
    }
}
exports.default = Task;
