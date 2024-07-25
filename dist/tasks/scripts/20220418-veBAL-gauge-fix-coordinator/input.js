"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const BalancerTokenAdmin = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY);
const GaugeController = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        AuthorizerAdaptor,
        BalancerTokenAdmin,
        GaugeController,
    },
};
