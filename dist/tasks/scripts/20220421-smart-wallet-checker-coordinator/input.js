"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const VotingEscrow = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const SmartWalletChecker = new _src_1.Task('20220420-smart-wallet-checker', _src_1.TaskMode.READ_ONLY);
exports.default = {
    AuthorizerAdaptor,
    VotingEscrow,
    SmartWalletChecker,
};
