import { Task } from '@src';
export type veBALDeploymentCoordinatorDeployment = {
    AuthorizerAdaptor: string;
    BalancerMinter: string;
    GaugeAdder: string;
    LiquidityGaugeFactory: string;
    SingleRecipientGaugeFactory: string;
    BALTokenHolderFactory: string;
    activationScheduledTime: string;
    thirdStageDelay: string;
};
declare const _default: {
    AuthorizerAdaptor: Task;
    BalancerMinter: Task;
    GaugeAdder: Task;
    LiquidityGaugeFactory: Task;
    SingleRecipientGaugeFactory: Task;
    BALTokenHolderFactory: Task;
    mainnet: {
        activationScheduledTime: string;
        thirdStageDelay: string;
    };
    kovan: {
        activationScheduledTime: string;
        thirdStageDelay: string;
    };
};
export default _default;
