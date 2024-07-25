import { Task } from '@src';
type CreateBoostCall = {
    delegator: string;
    receiver: string;
    percentage: number;
    cancel_time: number;
    expire_time: number;
    id: number;
};
type SetApprovalForAllCall = {
    operator: string;
    delegator: string;
};
export type PreseededVotingEscrowDelegationDeployment = {
    VotingEscrow: string;
    AuthorizerAdaptor: string;
    PreseededBoostCalls: CreateBoostCall[];
    PreseededApprovalCalls: SetApprovalForAllCall[];
};
declare const _default: {
    VotingEscrow: Task;
    AuthorizerAdaptor: Task;
    mainnet: {
        PreseededBoostCalls: {
            delegator: string;
            receiver: string;
            percentage: number;
            cancel_time: number;
            expire_time: number;
            id: number;
        }[];
        PreseededApprovalCalls: {
            operator: string;
            delegator: string;
        }[];
    };
    goerli: {
        PreseededBoostCalls: never[];
        PreseededApprovalCalls: never[];
    };
    sepolia: {
        PreseededBoostCalls: never[];
        PreseededApprovalCalls: never[];
    };
};
export default _default;
