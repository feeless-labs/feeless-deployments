"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.maxYieldValue, input.maxAUMValue];
    await task.deployAndVerify('ProtocolFeePercentagesProvider', args, from, force);
};
