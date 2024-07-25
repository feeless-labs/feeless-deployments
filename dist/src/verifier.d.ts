import { Network } from 'hardhat/types';
import { Libraries } from '@nomiclabs/hardhat-etherscan/dist/src/solc/libraries';
import Task from './task';
export default class Verifier {
    apiKey: string;
    network: Network;
    constructor(_network: Network, _apiKey: string);
    call(task: Task, name: string, address: string, constructorArguments: string | unknown[], libraries?: Libraries, intent?: number): Promise<string>;
    private verify;
    private attemptVerification;
    private verifyContract;
    private findBuildInfoWithContract;
    private trimmedBuildInfoInput;
    private getAbsoluteSourcePath;
    private getContractSourceName;
    private getContractImportedSourceNames;
}
