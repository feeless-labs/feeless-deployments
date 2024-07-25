import { Artifact, CompilerOutputContract } from 'hardhat/types';
import Task from './task';
/**
 * Extracts the artifact for the matching contract.
 * @param task - The task for which to extract the artifacts.
 * @param file - Name of the file within `build-info` where to look for the contract. All files within `build-info`
 * directory will be checked if undefined.
 * @param contract - Name of the contract to match. Filename shall be used if undefined.
 */
export declare function extractArtifact(task: Task, file?: string, contract?: string): void;
/**
 * Checks that the artifact files for `task` matches what is contained in the build-info file.
 * @param task - The task for which to check artifact integrity.
 */
export declare function checkArtifact(task: Task): void;
/**
 * Retrieves an artifact for the given `contractName` from the compilation output.
 *
 * @param sourceName The contract's source name.
 * @param contractName the contract's name.
 * @param contractOutput the contract's compilation output as emitted by `solc`.
 */
export declare function getArtifactFromContractOutput(sourceName: string, contractName: string, contractOutput: CompilerOutputContract): Artifact;
