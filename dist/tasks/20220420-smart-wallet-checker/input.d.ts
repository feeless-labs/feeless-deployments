import { Task } from '@src';
export type SmartWalletCheckerDeployment = {
    Vault: string;
    InitialAllowedAddresses: string[];
};
declare const _default: {
    Vault: Task;
    iotatestnet: {
        InitialAllowedAddresses: never[];
    };
    goerli: {
        InitialAllowedAddresses: never[];
    };
    sepolia: {
        InitialAllowedAddresses: never[];
    };
};
export default _default;
