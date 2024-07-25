"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const ChildChainLiquidityGaugeFactory = new _src_1.Task('20220413-child-chain-gauge-factory', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
exports.default = {
    ChildChainLiquidityGaugeFactory,
    AuthorizerAdaptor,
};
