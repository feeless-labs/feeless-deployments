"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const VotingEscrowDelegationProxy = new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY);
exports.default = {
    AuthorizerAdaptor,
    BalancerMinter,
    VotingEscrowDelegationProxy,
};
