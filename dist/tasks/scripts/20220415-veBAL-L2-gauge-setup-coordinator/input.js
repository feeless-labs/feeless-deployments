"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const VotingEscrow = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const GaugeAdder = new _src_1.Task('20220325-gauge-adder', _src_1.TaskMode.READ_ONLY);
const LiquidityGaugeFactory = new _src_1.Task('20220325-mainnet-gauge-factory', _src_1.TaskMode.READ_ONLY);
const PolygonRootGaugeFactory = new _src_1.Task('20220413-polygon-root-gauge-factory', _src_1.TaskMode.READ_ONLY);
const ArbitrumRootGaugeFactory = new _src_1.Task('20220413-arbitrum-root-gauge-factory', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        AuthorizerAdaptor,
        VotingEscrow,
        GaugeAdder,
        EthereumGaugeFactory: LiquidityGaugeFactory.output({ network: 'mainnet' }).LiquidityGaugeFactory,
        PolygonRootGaugeFactory,
        ArbitrumRootGaugeFactory,
    },
};
