"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const OldGaugeAdder = new _src_1.Task('20220325-gauge-adder', _src_1.TaskMode.READ_ONLY);
const NewGaugeAdder = new _src_1.Task('20220628-gauge-adder-v2', _src_1.TaskMode.READ_ONLY);
const ArbitrumRootGaugeFactory = new _src_1.Task('20220413-arbitrum-root-gauge-factory', _src_1.TaskMode.READ_ONLY);
const OptimismRootGaugeFactory = new _src_1.Task('20220628-optimism-root-gauge-factory', _src_1.TaskMode.READ_ONLY);
const LiquidityMiningMultisig = '0xc38c5f97b34e175ffd35407fc91a937300e33860';
const GaugeCheckpointingMultisig = '0x02f35dA6A02017154367Bc4d47bb6c7D06C7533B';
exports.default = {
    mainnet: {
        AuthorizerAdaptor,
        OldGaugeAdder: OldGaugeAdder.output({ network: 'mainnet' }).GaugeAdder,
        NewGaugeAdder: NewGaugeAdder.output({ network: 'mainnet' }).GaugeAdder,
        ArbitrumRootGaugeFactory,
        OptimismRootGaugeFactory,
        LiquidityMiningMultisig,
        GaugeCheckpointingMultisig,
    },
};
