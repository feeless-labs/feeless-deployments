"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const WETH = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BAL = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BaseVersion = { version: 4, deployment: '20230320-weighted-pool-v4' };
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new _src_1.Task('20220725-protocol-fee-percentages-provider', _src_1.TaskMode.READ_ONLY);
const NAME = "FLSIOTA";
const SYMBOL = "FLSIOTA";
const POOLNAME = "FLS/IOTA Weighted Pools";
exports.default = {
    WETH,
    BAL,
    SYMBOL,
    NAME,
    POOLNAME,
    FactoryVersion: JSON.stringify({ name: 'WeightedPoolFactory', ...BaseVersion }),
    PoolVersion: JSON.stringify({ name: 'WeightedPool', ...BaseVersion }),
    Vault,
    ProtocolFeePercentagesProvider
};
