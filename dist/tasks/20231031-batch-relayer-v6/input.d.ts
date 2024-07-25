import { Task } from '@src';
export type BatchRelayerDeployment = {
    Vault: string;
    wstETH: string;
    BalancerMinter: string;
    CanCallUserCheckpoint: boolean;
    Version: string;
};
declare const _default: {
    Vault: Task;
    Version: string;
    iotatestnet: {
        wstETH: string;
        BalancerMinter: Task;
        CanCallUserCheckpoint: boolean;
    };
};
export default _default;
