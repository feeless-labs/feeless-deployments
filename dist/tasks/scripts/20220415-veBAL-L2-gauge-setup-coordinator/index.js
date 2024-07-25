"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [
        input.AuthorizerAdaptor,
        input.VotingEscrow,
        input.GaugeAdder,
        input.EthereumGaugeFactory,
        input.PolygonRootGaugeFactory,
        input.ArbitrumRootGaugeFactory,
    ];
    await task.deployAndVerify('veBALL2GaugeSetupCoordinator', args, from, force);
};
