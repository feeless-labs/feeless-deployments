"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.BalancerMinter, input.PolygonZkEVMBridge];
    const factory = await task.deployAndVerify('PolygonZkEVMRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('PolygonZkEVMRootGauge', implementation, [input.BalancerMinter, input.PolygonZkEVMBridge]);
    await task.save({ PolygonZkEVMRootGauge: implementation });
};
