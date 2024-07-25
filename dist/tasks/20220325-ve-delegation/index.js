"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.VotingEscrow, 'VotingEscrow Delegation', 'veBoost', '', input.AuthorizerAdaptor];
    const votingEscrowDelegation = await task.deploy('VotingEscrowDelegation', args, from);
    const proxyArgs = [input.Vault, input.VotingEscrow, votingEscrowDelegation.address];
    await task.deployAndVerify('VotingEscrowDelegationProxy', proxyArgs, from, force);
};
