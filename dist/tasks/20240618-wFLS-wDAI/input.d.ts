import { Task } from '@src';
export type WeightedPoolDeployment = {
    BAL: String;
    DAI: String;
    SYMBOL: string;
    NAME: string;
    POOLNAME: string;
    FactoryVersion: string;
    PoolVersion: string;
    Vault: String;
    ProtocolFeePercentagesProvider: String;
};
declare const _default: {
    BAL: Task;
    DAI: Task;
    SYMBOL: string;
    NAME: string;
    POOLNAME: string;
    FactoryVersion: string;
    PoolVersion: string;
    Vault: Task;
    ProtocolFeePercentagesProvider: Task;
};
export default _default;
