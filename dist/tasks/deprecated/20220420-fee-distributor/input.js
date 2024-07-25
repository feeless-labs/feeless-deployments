"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const VotingEscrow = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    VotingEscrow,
    mainnet: {
        startTime: 1649894400, // Thursday, April 14, 2022 00:00:00 UTC
    },
    goerli: {
        startTime: 1654732800, // Thursday, June 9, 2022 00:00:00 UTC
    },
    kovan: {
        startTime: 1654732800000, //  Thursday, June 9, 2022 00:00:00 UTC
    },
};