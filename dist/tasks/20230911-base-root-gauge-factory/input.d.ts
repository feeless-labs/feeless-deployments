import { Task } from '@src';
export type BaseRootGaugeFactoryDeployment = {
    Vault: string;
    BalancerMinter: string;
    BaseBAL: string;
    L1StandardBridge: string;
};
declare const _default: {
    mainnet: {
        Vault: Task;
        BalancerMinter: Task;
        BaseBAL: string;
        L1StandardBridge: string;
    };
};
export default _default;
