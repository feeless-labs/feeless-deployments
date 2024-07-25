import { Task } from '@src';
export type VaultDeployment = {
    Authorizer: string;
    WETH: string;
    pauseWindowDuration: number;
    bufferPeriodDuration: number;
};
declare const _default: {
    Authorizer: Task;
    pauseWindowDuration: number;
    bufferPeriodDuration: number;
    WETH: Task;
};
export default _default;
