import { Task } from '@src';
export type ManagedPoolDeployment = {
    Vault: string;
    ProtocolFeePercentagesProvider: string;
    FactoryVersion: string;
    PoolVersion: string;
    InitialPauseWindowDuration: number;
    BufferPeriodDuration: number;
    WETH: string;
    BAL: string;
};
declare const _default: {
    Vault: Task;
    ProtocolFeePercentagesProvider: Task;
    FactoryVersion: string;
    PoolVersion: string;
    InitialPauseWindowDuration: number;
    BufferPeriodDuration: number;
    WETH: Task;
    BAL: Task;
};
export default _default;
