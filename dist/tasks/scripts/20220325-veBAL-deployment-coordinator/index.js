"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [
        input.BalancerMinter,
        input.AuthorizerAdaptor,
        input.GaugeAdder,
        input.LiquidityGaugeFactory,
        input.SingleRecipientGaugeFactory,
        input.BALTokenHolderFactory,
        input.activationScheduledTime,
        input.thirdStageDelay,
    ];
    await task.deployAndVerify('veBALDeploymentCoordinator', args, from, force);
};
