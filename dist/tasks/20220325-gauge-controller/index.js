"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const veBALArgs = [input.BPT, 'Vote Escrowed Balancer BPT', 'veBAL', input.AuthorizerAdaptor];
    const veBAL = await task.deploy('VotingEscrow', veBALArgs, from, force);
    const gaugeControllerArgs = [veBAL.address, input.AuthorizerAdaptor];
    const gaugeController = await task.deploy('GaugeController', gaugeControllerArgs, from, force);
    const minterArgs = [input.BalancerTokenAdmin, gaugeController.address];
    await task.deploy('BalancerMinter', minterArgs, from, force);
};
