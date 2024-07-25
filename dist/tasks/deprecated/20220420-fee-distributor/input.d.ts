import { Task } from '@src';
export type FeeDistributorDeployment = {
    VotingEscrow: string;
    startTime: number;
};
declare const _default: {
    VotingEscrow: Task;
    mainnet: {
        startTime: number;
    };
    goerli: {
        startTime: number;
    };
    kovan: {
        startTime: number;
    };
};
export default _default;
