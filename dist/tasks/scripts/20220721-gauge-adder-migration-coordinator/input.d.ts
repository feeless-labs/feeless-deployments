import { Task } from '@src';
export type GaugeAdderMigrationCoordinatorDeployment = {
    AuthorizerAdaptor: string;
    OldGaugeAdder: string;
    NewGaugeAdder: string;
    ArbitrumRootGaugeFactory: string;
    OptimismRootGaugeFactory: string;
    LiquidityMiningMultisig: string;
    GaugeCheckpointingMultisig: string;
};
declare const _default: {
    mainnet: {
        AuthorizerAdaptor: Task;
        OldGaugeAdder: string;
        NewGaugeAdder: string;
        ArbitrumRootGaugeFactory: Task;
        OptimismRootGaugeFactory: Task;
        LiquidityMiningMultisig: string;
        GaugeCheckpointingMultisig: string;
    };
};
export default _default;
