import { Task } from '@src';
export type GaugeAdderMigrationCoordinatorDeployment = {
    AuthorizerAdaptor: string;
    OldGaugeAdder: string;
    NewGaugeAdder: string;
    LiquidityGaugeFactory: string;
    PolygonRootGaugeFactory: string;
    ArbitrumRootGaugeFactory: string;
    OptimismRootGaugeFactory: string;
    GnosisRootGaugeFactory: string;
    PolygonZkEVMRootGaugeFactory: string;
    LiquidityMiningMultisig: string;
    GaugeCheckpointingMultisig: string;
};
declare const _default: {
    mainnet: {
        AuthorizerAdaptor: Task;
        OldGaugeAdder: string;
        NewGaugeAdder: string;
        LiquidityGaugeFactory: Task;
        PolygonRootGaugeFactory: Task;
        ArbitrumRootGaugeFactory: Task;
        OptimismRootGaugeFactory: Task;
        GnosisRootGaugeFactory: Task;
        PolygonZkEVMRootGaugeFactory: Task;
        LiquidityMiningMultisig: string;
        GaugeCheckpointingMultisig: string;
    };
};
export default _default;
