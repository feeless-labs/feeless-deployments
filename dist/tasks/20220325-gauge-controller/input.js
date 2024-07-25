"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const BalancerTokenAdmin = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY);
exports.default = {
    AuthorizerAdaptor,
    BalancerTokenAdmin,
    iotatestnet: {
        BPT: '0x0c3861100485C118f63e50D615E75daD491e19c2' // BPT of the canonical 80-20 BAL-WETH Pool
    }
};
