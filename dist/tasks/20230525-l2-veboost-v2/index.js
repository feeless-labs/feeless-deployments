"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@helpers/constants");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [constants_1.ZERO_ADDRESS, input.VotingEscrow];
    await task.deploy('VeBoostV2', args, from, force);
};
