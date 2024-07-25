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
const node_fetch_1 = __importDefault(require("node-fetch"));
const version_1 = require("@nomiclabs/hardhat-etherscan/dist/src/solc/version");
const ABIEncoder_1 = require("@nomiclabs/hardhat-etherscan/dist/src/ABIEncoder");
const libraries_1 = require("@nomiclabs/hardhat-etherscan/dist/src/solc/libraries");
const ChainConfig_1 = require("@nomiclabs/hardhat-etherscan/dist/src/ChainConfig");
const hardhat_config_1 = __importDefault(require("../hardhat.config"));
const bytecode_1 = require("@nomiclabs/hardhat-etherscan/dist/src/solc/bytecode");
const prober_1 = require("@nomiclabs/hardhat-etherscan/dist/src/network/prober");
const EtherscanVerifyContractRequest_1 = require("@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanVerifyContractRequest");
const EtherscanService_1 = require("@nomiclabs/hardhat-etherscan/dist/src/etherscan/EtherscanService");
const parser = __importStar(require("@solidity-parser/parser"));
const logger_1 = __importDefault(require("./logger"));
const buildinfo_1 = require("./buildinfo");
const MAX_VERIFICATION_INTENTS = 3;
class Verifier {
    constructor(_network, _apiKey) {
        this.network = _network;
        this.apiKey = _apiKey;
    }
    async call(task, name, address, constructorArguments, libraries = {}, intent = 1) {
        var _a;
        const response = await this.verify(task, name, address, constructorArguments, libraries);
        if (response.isVerificationSuccess()) {
            const etherscanEndpoints = await (0, prober_1.getEtherscanEndpoints)(this.network.provider, this.network.name, ChainConfig_1.chainConfig, (_a = hardhat_config_1.default.etherscan.customChains) !== null && _a !== void 0 ? _a : []);
            const contractURL = new URL(`/address/${address}#code`, etherscanEndpoints.urls.browserURL);
            return contractURL.toString();
        }
        else if (intent < MAX_VERIFICATION_INTENTS && response.isBytecodeMissingInNetworkError()) {
            logger_1.default.info(`Could not find deployed bytecode in network, retrying ${intent++}/${MAX_VERIFICATION_INTENTS}...`);
            (0, EtherscanService_1.delay)(5000);
            return this.call(task, name, address, constructorArguments, libraries, intent++);
        }
        else {
            throw new Error(`The contract verification failed. Reason: ${response.message}`);
        }
    }
    async verify(task, name, address, args, libraries = {}) {
        var _a;
        const deployedBytecodeHex = await (0, prober_1.retrieveContractBytecode)(address, this.network.provider, this.network.name);
        const deployedBytecode = new bytecode_1.Bytecode(deployedBytecodeHex);
        const buildInfos = await task.buildInfos();
        const buildInfo = this.findBuildInfoWithContract(buildInfos, name);
        buildInfo.input = this.trimmedBuildInfoInput(name, buildInfo.input);
        const sourceName = (0, buildinfo_1.findContractSourceName)(buildInfo, name);
        const contractInformation = await (0, bytecode_1.extractMatchingContractInformation)(sourceName, name, buildInfo, deployedBytecode);
        if (!contractInformation)
            throw Error('Could not find a bytecode matching the requested contract');
        const { libraryLinks } = await (0, libraries_1.getLibraryLinks)(contractInformation, libraries);
        contractInformation.libraryLinks = libraryLinks;
        const deployArgumentsEncoded = typeof args == 'string'
            ? args
            : await (0, ABIEncoder_1.encodeArguments)(contractInformation.contract.abi, contractInformation.sourceName, contractInformation.contractName, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args);
        const solcFullVersion = await (0, version_1.getLongVersion)(contractInformation.solcVersion);
        const etherscanEndpoints = await (0, prober_1.getEtherscanEndpoints)(this.network.provider, this.network.name, ChainConfig_1.chainConfig, (_a = hardhat_config_1.default.etherscan.customChains) !== null && _a !== void 0 ? _a : []);
        const verificationStatus = await this.attemptVerification(etherscanEndpoints, contractInformation, address, this.apiKey, buildInfo.input, solcFullVersion, deployArgumentsEncoded);
        if (verificationStatus.isVerificationSuccess())
            return verificationStatus;
        throw new Error(`The contract verification failed. Reason: ${verificationStatus.message}`);
    }
    async attemptVerification(etherscanEndpoints, contractInformation, contractAddress, etherscanAPIKey, compilerInput, solcFullVersion, deployArgumentsEncoded) {
        compilerInput.settings.libraries = contractInformation.libraryLinks;
        const request = (0, EtherscanVerifyContractRequest_1.toVerifyRequest)({
            apiKey: etherscanAPIKey,
            contractAddress,
            sourceCode: JSON.stringify(compilerInput),
            sourceName: contractInformation.sourceName,
            contractName: contractInformation.contractName,
            compilerVersion: solcFullVersion,
            constructorArguments: deployArgumentsEncoded,
        });
        const response = await this.verifyContract(etherscanEndpoints.urls.apiURL, request);
        const pollRequest = (0, EtherscanVerifyContractRequest_1.toCheckStatusRequest)({ apiKey: etherscanAPIKey, guid: response.message });
        await (0, EtherscanService_1.delay)(700);
        const verificationStatus = await (0, EtherscanService_1.getVerificationStatus)(etherscanEndpoints.urls.apiURL, pollRequest);
        if (verificationStatus.isVerificationFailure() || verificationStatus.isVerificationSuccess()) {
            return verificationStatus;
        }
        throw new Error(`The API responded with an unexpected message: ${verificationStatus.message}`);
    }
    async verifyContract(url, req) {
        const parameters = new URLSearchParams({ ...req });
        const requestDetails = { method: 'post', body: parameters };
        let response;
        try {
            response = await (0, node_fetch_1.default)(url, requestDetails);
        }
        catch (error) {
            throw Error(`Failed to send verification request. Reason: ${error.message}`);
        }
        if (!response.ok) {
            const responseText = await response.text();
            throw Error(`Failed to send verification request.\nHTTP code: ${response.status}.\nResponse: ${responseText}`);
        }
        const etherscanResponse = new EtherscanService_1.EtherscanResponse(await response.json());
        if (!etherscanResponse.isOk())
            throw Error(etherscanResponse.message);
        return etherscanResponse;
    }
    findBuildInfoWithContract(buildInfos, contractName) {
        const found = buildInfos.find((buildInfo) => (0, buildinfo_1.getAllFullyQualifiedNames)(buildInfo).some((name) => name.contractName === contractName));
        if (found === undefined) {
            throw Error(`Could not find a build info for contract ${contractName}`);
        }
        else {
            return found;
        }
    }
    // Trims the inputs of the build info to only keep imported files, avoiding submitting unnecessary source files for
    // verification (e.g. mocks). This is required because Hardhat compiles entire projects at once, resulting in a single
    // huge build info.
    trimmedBuildInfoInput(contractName, input) {
        // First we find all sources imported from our contract
        const sourceName = this.getContractSourceName(contractName, input);
        const importedSourceNames = this.getContractImportedSourceNames(sourceName, input, new Set().add(sourceName));
        // Then, we keep only those inputs. This method also preserves the order of the files, which may be important in
        // some versions of solc.
        return {
            ...input,
            sources: Object.keys(input.sources)
                .filter((source) => importedSourceNames.has(source))
                .map((source) => ({ [source]: input.sources[source] }))
                .reduce((previous, current) => Object.assign(previous, current), {}),
        };
    }
    getAbsoluteSourcePath(relativeSourcePath, input) {
        // We're not actually converting from relative to absolute but rather guessing: we'll extract the filename from the
        // relative path, and then look for a source name in the inputs that matches it.
        const contractName = relativeSourcePath.match(/.*\/(\w*)\.sol/)[1];
        return this.getContractSourceName(contractName, input);
    }
    getContractSourceName(contractName, input) {
        const absoluteSourcePath = Object.keys(input.sources).find((absoluteSourcePath) => absoluteSourcePath.includes(`/${contractName}.sol`));
        if (absoluteSourcePath === undefined) {
            throw new Error(`Could not find source name for ${contractName}`);
        }
        return absoluteSourcePath;
    }
    getContractImportedSourceNames(sourceName, input, previousSourceNames) {
        const ast = parser.parse(input.sources[sourceName].content);
        parser.visit(ast, {
            ImportDirective: (node) => {
                // Imported paths might be relative, so we convert them to absolute
                const importedSourceName = this.getAbsoluteSourcePath(node.path, input);
                if (!previousSourceNames.has(importedSourceName)) {
                    // New source!
                    previousSourceNames = this.getContractImportedSourceNames(importedSourceName, input, new Set(previousSourceNames).add(importedSourceName));
                }
            },
        });
        return previousSourceNames;
    }
}
exports.default = Verifier;
