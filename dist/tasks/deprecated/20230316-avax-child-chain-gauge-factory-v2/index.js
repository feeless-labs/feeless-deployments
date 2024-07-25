"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const gaugeArgs = [
        input.VotingEscrowDelegationProxy,
        input.L2BalancerPseudoMinter,
        input.AuthorizerAdaptor,
        input.ProductVersion,
    ];
    // ChildChainGauge is written in Vyper, so we only deploy.
    const gaugeImplementation = await task.deploy('ChildChainGauge', gaugeArgs, from, force);
    const factoryArgs = [gaugeImplementation.address, input.FactoryVersion, input.ProductVersion];
    await task.deployAndVerify('ChildChainGaugeFactory', factoryArgs, from, force);
};
