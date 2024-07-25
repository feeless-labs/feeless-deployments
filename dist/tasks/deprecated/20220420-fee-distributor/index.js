"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.VotingEscrow, input.startTime];
    await task.deployAndVerify('FeeDistributor', args, from, force);
};
