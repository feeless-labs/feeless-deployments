"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const time_1 = require("@helpers/time");
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new _src_1.Task('20220725-protocol-fee-percentages-provider', _src_1.TaskMode.READ_ONLY);
const BaseVersion = { version: 2, deployment: '20230411-managed-pool-v2' };
const WETH = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BAL = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
// Since these pools have many experimental features, use a longer pause period.
const extendedPauseWindowDuration = time_1.MONTH * 9;
exports.default = {
    Vault,
    ProtocolFeePercentagesProvider,
    FactoryVersion: JSON.stringify({ name: 'ManagedPoolFactory', ...BaseVersion }),
    PoolVersion: JSON.stringify({ name: 'ManagedPool', ...BaseVersion }),
    InitialPauseWindowDuration: extendedPauseWindowDuration,
    BufferPeriodDuration: time_1.MONTH,
    WETH,
    BAL,
};
