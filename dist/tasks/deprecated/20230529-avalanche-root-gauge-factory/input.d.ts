import { BigNumber } from 'ethers';
import { Task } from '@src';
export type AvalancheRootGaugeFactoryDeployment = {
    Vault: string;
    BalancerMinter: string;
    MultichainRouter: string;
    MinBridgeLimit: BigNumber;
    MaxBridgeLimit: BigNumber;
};
declare const _default: {
    mainnet: {
        Vault: Task;
        BalancerMinter: Task;
        MultichainRouter: string;
        MinBridgeLimit: BigNumber;
        MaxBridgeLimit: BigNumber;
    };
};
export default _default;
