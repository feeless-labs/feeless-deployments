"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.AuthorizerAdaptor, input.ProtocolFeesWithdrawer, input.tokens, input.amounts];
    await task.deployAndVerify('SNXRecoveryCoordinator', args, from, force);
};
