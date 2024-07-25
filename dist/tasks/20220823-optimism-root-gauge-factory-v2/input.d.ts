import { Task } from '@src';
export type OptimismRootGaugeFactoryDeployment = {
    Vault: string;
    BalancerMinter: string;
    OptimismBAL: string;
    L1StandardBridge: string;
    GasLimit: number;
};
declare const _default: {
    mainnet: {
        Vault: Task;
        BalancerMinter: Task;
        OptimismBAL: string;
        L1StandardBridge: string;
        GasLimit: number;
    };
};
export default _default;
