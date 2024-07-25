import { Task } from '@src';
export type GearboxLinearPoolDeployment = {
    Vault: string;
    BalancerQueries: string;
    ProtocolFeePercentagesProvider: string;
    WETH: string;
    FactoryVersion: string;
    PoolVersion: string;
    InitialPauseWindowDuration: number;
    BufferPeriodDuration: number;
};
declare const _default: {
    Vault: Task;
    BalancerQueries: Task;
    ProtocolFeePercentagesProvider: Task;
    WETH: Task;
    FactoryVersion: string;
    PoolVersion: string;
    InitialPauseWindowDuration: number;
    BufferPeriodDuration: number;
};
export default _default;
