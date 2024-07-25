"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.BalancerMinter];
    const factory = await task.deployAndVerify('SingleRecipientGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('SingleRecipientGauge', implementation, [input.BalancerMinter]);
    await task.save({ SingleRecipientGauge: implementation });
};
