"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.InitialDeniedTokens];
    await task.deployAndVerify('ProtocolFeesWithdrawer', args, from, force);
};
