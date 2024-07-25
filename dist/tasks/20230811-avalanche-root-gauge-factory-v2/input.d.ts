import { Task } from '@src';
export type AvalancheRootGaugeFactoryDeployment = {
    Vault: string;
    BalancerMinter: string;
    BALProxy: string;
};
declare const _default: {
    mainnet: {
        Vault: Task;
        BalancerMinter: Task;
        BALProxy: string;
    };
};
export default _default;
