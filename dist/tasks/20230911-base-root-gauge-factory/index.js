"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.BalancerMinter, input.L1StandardBridge, input.BaseBAL];
    const factory = await task.deployAndVerify('BaseRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('BaseRootGauge', implementation, [input.BalancerMinter, input.L1StandardBridge, input.BaseBAL]);
    task.save({ BaseRootGauge: implementation });
};
