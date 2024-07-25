import { Task } from '@src';
export type BatchRelayerDeployment = {
    Vault: string;
    wstETH: string;
};
declare const _default: {
    mainnet: {
        Vault: Task;
        wstETH: string;
    };
    kovan: {
        Vault: Task;
        wstETH: string;
    };
    goerli: {
        Vault: Task;
        wstETH: string;
    };
    rinkeby: {
        Vault: Task;
        wstETH: string;
    };
    polygon: {
        Vault: Task;
        wstETH: string;
    };
    arbitrum: {
        Vault: Task;
        wstETH: string;
    };
};
export default _default;
