import { Task } from '@src';
export type SNXRecoveryCoordinatorDeployment = {
    AuthorizerAdaptor: string;
    ProtocolFeesWithdrawer: string;
    tokens: string[];
    amounts: string[];
};
declare const _default: {
    AuthorizerAdaptor: Task;
    ProtocolFeesWithdrawer: Task;
    mainnet: {
        tokens: string[];
        amounts: string[];
    };
    optimism: {
        tokens: string[];
        amounts: string[];
    };
};
export default _default;
