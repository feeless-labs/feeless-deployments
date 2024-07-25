import { Task } from '@src';
export type EulerLinearPoolDeployment = {
    Vault: string;
    BalancerQueries: string;
    ProtocolFeePercentagesProvider: string;
    WETH: string;
    FactoryVersion: string;
    PoolVersion: string;
    InitialPauseWindowDuration: number;
    BufferPeriodDuration: number;
    EulerProtocol: string;
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
    EulerProtocol: string;
};
export default _default;
