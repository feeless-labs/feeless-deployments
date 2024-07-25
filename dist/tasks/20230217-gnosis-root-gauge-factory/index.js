"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.BalancerMinter, input.GnosisBridge];
    const factory = await task.deployAndVerify('GnosisRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('GnosisRootGauge', implementation, [input.BalancerMinter, input.GnosisBridge]);
    await task.save({ GnosisRootGauge: implementation });
};
