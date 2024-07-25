"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@helpers/constants");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const nullVotingEscrow = await task.deployAndVerify('NullVotingEscrow', [], from, force);
    const veDelegationProxyArgs = [input.Vault, nullVotingEscrow.address, constants_1.ZERO_ADDRESS];
    await task.deployAndVerify('VotingEscrowDelegationProxy', veDelegationProxyArgs, from, force);
};
