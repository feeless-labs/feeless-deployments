import { Task } from '@src';
export type LidoRelayerDeployment = {
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
};
export default _default;
