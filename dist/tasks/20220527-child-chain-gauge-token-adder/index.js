"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.ChildChainLiquidityGaugeFactory, input.AuthorizerAdaptor];
    await task.deployAndVerify('ChildChainGaugeTokenAdder', args, from, force);
};
