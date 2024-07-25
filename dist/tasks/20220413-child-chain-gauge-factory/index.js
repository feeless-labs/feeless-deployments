"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const gaugeArgs = [input.BAL, input.Vault, input.AuthorizerAdaptor];
    const gaugeImplementation = await task.deploy('RewardsOnlyGauge', gaugeArgs, from, force);
    const streamerArgs = [input.BAL, input.AuthorizerAdaptor];
    const streamerImplementation = await task.deploy('ChildChainStreamer', streamerArgs, from, force);
    const factoryArgs = [gaugeImplementation.address, streamerImplementation.address];
    await task.deployAndVerify('ChildChainLiquidityGaugeFactory', factoryArgs, from, force);
};
