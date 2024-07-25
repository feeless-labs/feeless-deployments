"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const GaugeAdder = new _src_1.Task('20220325-gauge-adder', _src_1.TaskMode.READ_ONLY);
const LiquidityGaugeFactory = new _src_1.Task('20220325-mainnet-gauge-factory', _src_1.TaskMode.READ_ONLY);
const SingleRecipientGaugeFactory = new _src_1.Task('20220325-single-recipient-gauge-factory', _src_1.TaskMode.READ_ONLY);
const BALTokenHolderFactory = new _src_1.Task('20220325-bal-token-holder-factory', _src_1.TaskMode.READ_ONLY);
exports.default = {
    AuthorizerAdaptor,
    BalancerMinter,
    GaugeAdder,
    LiquidityGaugeFactory,
    SingleRecipientGaugeFactory,
    BALTokenHolderFactory,
    mainnet: {
        activationScheduledTime: '1648465200',
        thirdStageDelay: '691200', // 8 days
    },
    kovan: {
        activationScheduledTime: '1647459355',
        thirdStageDelay: '600',
    },
};
