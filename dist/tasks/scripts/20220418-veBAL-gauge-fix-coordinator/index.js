"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.AuthorizerAdaptor, input.BalancerTokenAdmin, input.GaugeController];
    await task.deployAndVerify('veBALGaugeFixCoordinator', args, from, force);
};
