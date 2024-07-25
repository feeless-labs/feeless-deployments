import { Task } from '@src';
export type ComposableStablePoolDeployment = {
    Vault: string;
    ProtocolFeePercentagesProvider: string;
    FactoryVersion: string;
    PoolVersion: string;
    WETH: string;
    BAL: string;
};
declare const _default: {
    Vault: Task;
    ProtocolFeePercentagesProvider: Task;
    WETH: Task;
    BAL: Task;
    FactoryVersion: string;
    PoolVersion: string;
};
export default _default;
