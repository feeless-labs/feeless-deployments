"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtifactFromContractOutput = exports.checkArtifact = exports.extractArtifact = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const fs_2 = __importDefault(require("fs"));
/**
 * Extracts the artifact for the matching contract.
 * @param task - The task for which to extract the artifacts.
 * @param file - Name of the file within `build-info` where to look for the contract. All files within `build-info`
 * directory will be checked if undefined.
 * @param contract - Name of the contract to match. Filename shall be used if undefined.
 */
function extractArtifact(task, file, contract) {
    const buildInfoDirectory = path_1.default.resolve(task.dir(), 'build-info');
    if ((0, fs_1.existsSync)(buildInfoDirectory) && (0, fs_1.statSync)(buildInfoDirectory).isDirectory()) {
        if (file) {
            _extractArtifact(task, file, contract);
        }
        else {
            for (const buildInfoFileName of (0, fs_1.readdirSync)(buildInfoDirectory)) {
                const fileName = path_1.default.parse(buildInfoFileName).name;
                _extractArtifact(task, fileName, contract);
            }
        }
    }
}
exports.extractArtifact = extractArtifact;
function _extractArtifact(task, file, contract) {
    contract = contract !== null && contract !== void 0 ? contract : file;
    const artifact = task.artifact(contract, file);
    writeContractArtifact(task, contract, artifact);
    logger_1.default.success(`Artifacts created for ${contract} contract found in ${file} build-info file`);
}
/**
 * Checks that the artifact files for `task` matches what is contained in the build-info file.
 * @param task - The task for which to check artifact integrity.
 */
function checkArtifact(task) {
    let readmeLines = [];
    const filePath = path_1.default.join(task.dir(), `readme.md`);
    const readmeFileExists = fs_2.default.existsSync(filePath) && fs_2.default.statSync(filePath).isFile();
    if (readmeFileExists) {
        const readmeContents = fs_2.default.readFileSync(filePath).toString();
        readmeLines = readmeContents.split('\n');
    }
    const buildInfoDirectory = path_1.default.resolve(task.dir(), 'build-info');
    if ((0, fs_1.existsSync)(buildInfoDirectory) && (0, fs_1.statSync)(buildInfoDirectory).isDirectory()) {
        for (const buildInfoFileName of (0, fs_1.readdirSync)(buildInfoDirectory)) {
            const fileName = path_1.default.parse(buildInfoFileName).name;
            const contractName = fileName;
            const expectedArtifact = task.artifact(contractName, fileName);
            const actualArtifact = readContractArtifact(task, contractName);
            const artifactMatch = JSON.stringify(actualArtifact) === JSON.stringify(expectedArtifact);
            if (artifactMatch) {
                logger_1.default.success(`Verified artifact integrity of contract '${contractName}' of task '${task.id}'`);
                // Since this is an *artifact* check, don't fail if there is no readme at all (mixing concerns).
                // If there is a readme, it must contain a link to all artifacts, though.
                if (readmeFileExists) {
                    checkReadmeArtifactLink(task, contractName, readmeLines);
                }
            }
            else {
                throw Error(`The artifact for contract '${contractName}' of task '${task.id}' does not match the contents of its build-info`);
            }
        }
    }
}
exports.checkArtifact = checkArtifact;
/**
 * Ensure there is a readme with the expected link to the artifact file (and no invalid ones).
 */
function checkReadmeArtifactLink(task, contractName, readmeLines) {
    const expectedContent = `- [\`${contractName}\` artifact](./artifact/${contractName}.json)`;
    const linkFound = readmeLines.find((line) => line.toLowerCase() == expectedContent.toLowerCase()) !== undefined;
    if (linkFound) {
        logger_1.default.success(`Verified artifact link for contract '${contractName}' of task '${task.id}'`);
    }
    else {
        throw Error(`Missing or malformed artifact link for contract '${contractName}' of task '${task.id}'`);
    }
}
/**
 * Read the saved artifact for the contract `contractName`.
 */
function readContractArtifact(task, contractName) {
    // Read contract ABI from file
    const artifactFilePath = path_1.default.resolve(task.dir(), 'artifact', `${contractName}.json`);
    const artifactFileExists = (0, fs_1.existsSync)(artifactFilePath) && (0, fs_1.statSync)(artifactFilePath).isFile();
    const artifact = artifactFileExists ? JSON.parse((0, fs_1.readFileSync)(artifactFilePath).toString()) : null;
    return artifact;
}
/**
 * Write the ABI and bytecode for the contract `contractName` to the ABI and bytecode files.
 */
function writeContractArtifact(task, contractName, artifact) {
    const artifactDirectory = path_1.default.resolve(task.dir(), 'artifact');
    if (!(0, fs_1.existsSync)(artifactDirectory)) {
        (0, fs_1.mkdirSync)(artifactDirectory);
    }
    const abiFilePath = path_1.default.resolve(artifactDirectory, `${contractName}.json`);
    (0, fs_1.writeFileSync)(abiFilePath, JSON.stringify(artifact, null, 2));
}
// The code below is copied from the `hardhat-core` package
// https://github.com/NomicFoundation/hardhat/blob/080a25a7e188311d7e56366e1dae669db81aa2d7/packages/hardhat-core/src/internal/artifacts.ts#L870-L918
const ARTIFACT_FORMAT_VERSION = 'hh-sol-artifact-1';
/**
 * Retrieves an artifact for the given `contractName` from the compilation output.
 *
 * @param sourceName The contract's source name.
 * @param contractName the contract's name.
 * @param contractOutput the contract's compilation output as emitted by `solc`.
 */
function getArtifactFromContractOutput(sourceName, contractName, contractOutput) {
    const evmBytecode = contractOutput.evm && contractOutput.evm.bytecode;
    let bytecode = evmBytecode && evmBytecode.object ? evmBytecode.object : '';
    if (bytecode.slice(0, 2).toLowerCase() !== '0x') {
        bytecode = `0x${bytecode}`;
    }
    const evmDeployedBytecode = contractOutput.evm && contractOutput.evm.deployedBytecode;
    let deployedBytecode = evmDeployedBytecode && evmDeployedBytecode.object ? evmDeployedBytecode.object : '';
    if (deployedBytecode.slice(0, 2).toLowerCase() !== '0x') {
        deployedBytecode = `0x${deployedBytecode}`;
    }
    const linkReferences = evmBytecode && evmBytecode.linkReferences ? evmBytecode.linkReferences : {};
    const deployedLinkReferences = evmDeployedBytecode && evmDeployedBytecode.linkReferences ? evmDeployedBytecode.linkReferences : {};
    return {
        _format: ARTIFACT_FORMAT_VERSION,
        contractName,
        sourceName,
        abi: contractOutput.abi,
        bytecode,
        deployedBytecode,
        linkReferences,
        deployedLinkReferences,
    };
}
exports.getArtifactFromContractOutput = getArtifactFromContractOutput;
