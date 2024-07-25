import { Task } from '@src';
export type BatchRelayerDeployment = {
    Vault: string;
    wstETH: string;
    BalancerMinter: string;
};
declare const _default: {
    Vault: Task;
    mainnet: {
        wstETH: string;
        BalancerMinter: Task;
    };
    goerli: {
        wstETH: string;
        BalancerMinter: Task;
    };
    polygon: {
        wstETH: string;
        BalancerMinter: string;
    };
    arbitrum: {
        wstETH: string;
        BalancerMinter: string;
    };
    optimism: {
        wstETH: string;
        BalancerMinter: string;
    };
    gnosis: {
        wstETH: string;
        BalancerMinter: string;
    };
    bsc: {
        wstETH: string;
        BalancerMinter: string;
    };
    avalanche: {
        wstETH: string;
        BalancerMinter: string;
    };
};
export default _default;
