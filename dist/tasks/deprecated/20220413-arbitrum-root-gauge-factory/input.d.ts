import { Task } from '@src';
export type ArbitrumRootGaugeFactoryDeployment = {
    Vault: string;
    BalancerMinter: string;
    GatewayRouter: string;
    GasLimit: number;
    GasPrice: number;
    MaxSubmissionCost: number;
};
declare const _default: {
    mainnet: {
        Vault: Task;
        BalancerMinter: Task;
        GatewayRouter: string;
        GasLimit: number;
        GasPrice: number;
        MaxSubmissionCost: number;
    };
};
export default _default;
