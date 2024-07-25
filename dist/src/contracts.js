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
exports.getArtifact = exports.deploymentTxData = exports.instanceAt = exports.deploy = void 0;
const artifacts_1 = require("hardhat/internal/artifacts");
const signers_1 = require("./signers");
const path_1 = __importDefault(require("path"));
const Config = __importStar(require("../hardhat.config"));
async function deploy(contract, args = [], from, libs) {
    if (!args)
        args = [];
    if (!from)
        from = await (0, signers_1.getSigner)();
    const artifact = typeof contract === 'string' ? getArtifact(contract) : contract;
    const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
    const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });
    const deployment = await factory.connect(from).deploy(...args);
    console.warn("deployed");
    return deployment.deployed();
}
exports.deploy = deploy;
async function instanceAt(contract, address) {
    const artifact = typeof contract === 'string' ? getArtifact(contract) : contract;
    const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
    return ethers.getContractAt(artifact.abi, address);
}
exports.instanceAt = instanceAt;
async function deploymentTxData(artifact, args = [], libs) {
    const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
    const factory = await ethers.getContractFactoryFromArtifact(artifact, { libraries: libs });
    const { data } = factory.getDeployTransaction(...args);
    if (data === undefined)
        throw new Error('Deploy transaction with no data. Something is very wrong');
    return data.toString();
}
exports.deploymentTxData = deploymentTxData;
function getArtifact(contract) {
    let artifactsPath;
    if (!contract.includes('/')) {
        artifactsPath = path_1.default.resolve(Config.default.paths.artifacts);
    }
    else {
        const packageName = `@balancer-labs/${contract.split('/')[0]}`;
        const packagePath = path_1.default.dirname(require.resolve(`${packageName}/package.json`));
        artifactsPath = `${packagePath}/artifacts`;
    }
    const artifacts = new artifacts_1.Artifacts(artifactsPath);
    return artifacts.readArtifactSync(contract.split('/').slice(-1)[0]);
}
exports.getArtifact = getArtifact;
