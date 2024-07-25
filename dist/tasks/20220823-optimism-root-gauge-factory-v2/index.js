"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.BalancerMinter, input.L1StandardBridge, input.OptimismBAL, input.GasLimit];
    const factory = await task.deployAndVerify('OptimismRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('OptimismRootGauge', implementation, [
        input.BalancerMinter,
        input.L1StandardBridge,
        input.OptimismBAL,
    ]);
    await task.save({ OptimismRootGauge: implementation });
};
