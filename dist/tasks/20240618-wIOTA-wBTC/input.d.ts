import { Task } from '@src';
export type WeightedPoolDeployment = {
    WETH: String;
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
    WETH: Task;
    WBTC: Task;
    SYMBOL: string;
    NAME: string;
    POOLNAME: string;
    FactoryVersion: string;
    PoolVersion: string;
    Vault: Task;
    ProtocolFeePercentagesProvider: Task;
};
export default _default;
