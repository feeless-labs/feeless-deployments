"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        Vault,
        BalancerMinter,
        // The original BAL token was replaced (See https://github.com/balancer/balancer-deployments/pull/77#issue-1848405451)
        // https://basescan.org/token/0x4158734D47Fc9692176B5085E0F52ee0Da5d47F1
        BaseBAL: '0x4158734D47Fc9692176B5085E0F52ee0Da5d47F1',
        L1StandardBridge: '0x3154Cf16ccdb4C6d922629664174b904d80F2C35',
    },
};
