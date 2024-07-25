import { BuildInfo } from 'hardhat/types';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import Verifier from './verifier';
import { Network, Libraries, Artifact, Input, Output, Param, RawInputKeyValue, RawOutput, TaskRunOptions } from './types';
export declare enum TaskMode {
    LIVE = 0,
    TEST = 1,
    CHECK = 2,
    READ_ONLY = 3
}
export declare enum TaskStatus {
    ACTIVE = 0,
    DEPRECATED = 1,
    SCRIPT = 2
}
export default class Task {
    id: string;
    mode: TaskMode;
    _network?: Network;
    _verifier?: Verifier;
    constructor(idAlias: string, mode: TaskMode, network?: Network, verifier?: Verifier);
    get network(): string;
    set network(name: Network);
    instanceAt(name: string, address: string): Promise<Contract>;
    deployedInstance(name: string): Promise<Contract>;
    inputInstance(artifactName: string, inputName: string): Promise<Contract>;
    deployAndVerify(name: string, args?: Array<Param>, from?: SignerWithAddress, force?: boolean, libs?: Libraries): Promise<Contract>;
    deploy(name: string, args?: Array<Param>, from?: SignerWithAddress, force?: boolean, libs?: Libraries): Promise<Contract>;
    verify(name: string, address: string, constructorArguments: string | unknown[], libs?: Libraries): Promise<void>;
    check(name: string, args?: Array<Param>, libs?: Libraries): Promise<Contract>;
    run(options?: TaskRunOptions): Promise<void>;
    dir(): string;
    buildInfo(fileName: string): BuildInfo;
    buildInfos(): Array<BuildInfo>;
    artifact(contractName: string, fileName?: string): Artifact;
    actionId(contractName: string, signature: string): string;
    rawInput(): RawInputKeyValue;
    input(): Input;
    output({ ensure, network }?: {
        ensure?: boolean;
        network?: Network;
    }): Output;
    settings(): RawInputKeyValue;
    hasOutput(): boolean;
    save(rawOutput: RawOutput): void;
    getStatus(): TaskStatus;
    private _getDefaultExportForNetwork;
    private _checkManuallySavedArtifacts;
    private _save;
    private _parseRawInput;
    private _parseRawOutput;
    private _read;
    private _write;
    private _fileAt;
    private _dirAt;
    private _existsFile;
    private _existsDir;
    private _isTask;
    private _findTaskId;
    /**
     * Return all directories inside the top 3 fixed task directories in a flat, sorted array.
     */
    static getAllTaskIds(): string[];
}
