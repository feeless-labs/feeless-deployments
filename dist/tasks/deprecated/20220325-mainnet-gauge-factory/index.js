"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const gaugeImplementationArgs = [input.BalancerMinter, input.VotingEscrowDelegationProxy, input.AuthorizerAdaptor];
    const gaugeImplementation = await task.deploy('LiquidityGaugeV5', gaugeImplementationArgs, from, force);
    const args = [gaugeImplementation.address];
    await task.deployAndVerify('LiquidityGaugeFactory', args, from, force);
};
