"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [
        input.AuthorizerAdaptor,
        input.NewGaugeAdder,
        input.OldGaugeAdder,
        input.LiquidityGaugeFactory,
        input.PolygonRootGaugeFactory,
        input.ArbitrumRootGaugeFactory,
        input.OptimismRootGaugeFactory,
        input.LiquidityMiningMultisig,
        input.GaugeCheckpointingMultisig,
    ];
    await task.deployAndVerify('GaugeAdderMigrationCoordinator', args, from, force);
};
