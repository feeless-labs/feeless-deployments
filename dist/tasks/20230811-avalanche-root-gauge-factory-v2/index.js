"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.BalancerMinter, input.BALProxy];
    const factory = await task.deployAndVerify('AvalancheRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('AvalancheRootGauge', implementation, [input.BalancerMinter, input.BALProxy]);
    task.save({ AvalancheRootGauge: implementation });
};
