"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const time_1 = require("@helpers/time");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const BalancerQueries = new _src_1.Task('20220721-balancer-queries', _src_1.TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new _src_1.Task('20220725-protocol-fee-percentages-provider', _src_1.TaskMode.READ_ONLY);
const WETH = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BaseVersion = { version: 4, deployment: '20230409-erc4626-linear-pool-v4' };
exports.default = {
    Vault,
    BalancerQueries,
    ProtocolFeePercentagesProvider,
    WETH,
    FactoryVersion: JSON.stringify({ name: 'ERC4626LinearPoolFactory', ...BaseVersion }),
    PoolVersion: JSON.stringify({ name: 'ERC4626LinearPool', ...BaseVersion }),
    InitialPauseWindowDuration: time_1.MONTH * 3,
    BufferPeriodDuration: time_1.MONTH,
};
