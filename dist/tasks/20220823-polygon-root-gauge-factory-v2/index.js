"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.BalancerMinter, input.PolygonRootChainManager, input.PolygonERC20Predicate];
    const factory = await task.deployAndVerify('PolygonRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('PolygonRootGauge', implementation, args);
    await task.save({ PolygonRootGauge: implementation });
};
