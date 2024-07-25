"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const adaptorArgs = [input.Vault];
    const omniVotingEscrowAdaptor = await task.deployAndVerify('OmniVotingEscrowAdaptor', adaptorArgs, from, force);
    const remapperArgs = [input.Vault, input.VotingEscrow, omniVotingEscrowAdaptor.address];
    await task.deployAndVerify('VotingEscrowRemapper', remapperArgs, from, force);
};
