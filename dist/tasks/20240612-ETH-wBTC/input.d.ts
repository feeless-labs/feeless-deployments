import { Task } from '@src';
export type WeightedPoolDeployment = {
    WETHER: String;
    WBTC: String;
    SYMBOL: string;
    NAME: string;
    POOLNAME: string;
    FactoryVersion: string;
    PoolVersion: string;
    Vault: String;
    ProtocolFeePercentagesProvider: String;
};
declare const _default: {
    WBTC: Task;
    WETHER: Task;
    SYMBOL: string;
    NAME: string;
    POOLNAME: string;
    FactoryVersion: string;
    PoolVersion: string;
    Vault: Task;
    ProtocolFeePercentagesProvider: Task;
};
export default _default;
