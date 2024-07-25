import { BuildInfo } from 'hardhat/types';
export declare function findContractSourceName(buildInfo: BuildInfo, contractName: string): string;
export declare function getAllFullyQualifiedNames(buildInfo: BuildInfo): Array<{
    sourceName: string;
    contractName: string;
}>;
