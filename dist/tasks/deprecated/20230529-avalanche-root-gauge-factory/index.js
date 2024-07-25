"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.BalancerMinter, input.MultichainRouter, input.MinBridgeLimit, input.MaxBridgeLimit];
    const factory = await task.deployAndVerify('AvalancheRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('AvalancheRootGauge', implementation, [input.BalancerMinter, input.MultichainRouter]);
    await task.save({ AvalancheRootGauge: implementation });
};
