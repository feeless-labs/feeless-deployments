import { Task } from '@src';
export type veBALL2GaugeSetupCoordinatorDeployment = {
    AuthorizerAdaptor: string;
    VotingEscrow: string;
    GaugeAdder: string;
    EthereumGaugeFactory: string;
    PolygonRootGaugeFactory: string;
    ArbitrumRootGaugeFactory: string;
};
declare const _default: {
    mainnet: {
        AuthorizerAdaptor: Task;
        VotingEscrow: Task;
        GaugeAdder: Task;
        EthereumGaugeFactory: string;
        PolygonRootGaugeFactory: Task;
        ArbitrumRootGaugeFactory: Task;
    };
};
export default _default;
