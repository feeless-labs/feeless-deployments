import { Task } from '@src';
export type BatchRelayerDeployment = {
    Vault: string;
    wstETH: string;
};
declare const _default: {
    Vault: Task;
    mainnet: {
        wstETH: string;
    };
    kovan: {
        wstETH: string;
    };
    polygon: {
        wstETH: string;
    };
    arbitrum: {
        wstETH: string;
    };
    goerli: {
        wstETH: string;
    };
};
export default _default;
