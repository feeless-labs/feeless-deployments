"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new _src_1.Task('20220725-protocol-fee-percentages-provider', _src_1.TaskMode.READ_ONLY);
const WETH = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BAL = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BaseVersion = { version: 6, deployment: '20240223-composable-stable-pool-v6' };
exports.default = {
    Vault,
    ProtocolFeePercentagesProvider,
    WETH,
    BAL,
    FactoryVersion: JSON.stringify({ name: 'ComposableStablePoolFactory', ...BaseVersion }),
    PoolVersion: JSON.stringify({ name: 'ComposableStablePool', ...BaseVersion }),
};
