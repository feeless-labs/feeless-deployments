"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const VotingEscrow = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const PreseededVotingEscrowDelegation = new _src_1.Task('20220530-preseeded-voting-escrow-delegation', _src_1.TaskMode.READ_ONLY);
exports.default = {
    VotingEscrow,
    PreseededVotingEscrowDelegation,
};
