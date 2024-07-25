"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.AuthorizerAdaptor, input.VotingEscrow, input.SmartWalletChecker];
    await task.deployAndVerify('SmartWalletCheckerCoordinator', args, from, force);
};
