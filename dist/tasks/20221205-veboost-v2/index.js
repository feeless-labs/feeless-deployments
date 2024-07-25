"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.PreseededVotingEscrowDelegation, input.VotingEscrow];
    await task.deploy('VeBoostV2', args, from, force);
};
