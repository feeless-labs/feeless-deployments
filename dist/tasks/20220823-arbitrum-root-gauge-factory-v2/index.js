"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [
        input.Vault,
        input.BalancerMinter,
        input.GatewayRouter,
        input.GasLimit,
        input.GasPrice,
        input.MaxSubmissionCost,
    ];
    const factory = await task.deployAndVerify('ArbitrumRootGaugeFactory', args, from, force);
    const implementation = await factory.getGaugeImplementation();
    await task.verify('ArbitrumRootGauge', implementation, [input.BalancerMinter, input.GatewayRouter]);
    await task.save({ ArbitrumRootGauge: implementation });
};
