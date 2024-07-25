"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const Version = JSON.stringify({
    name: 'ChildChainGauge checkpointer (BalancerRelayer)',
    version: 5.1,
    deployment: '20230712-child-chain-gauge-checkpointer',
});
// We will not use the minter nor wstETH for this deployment.
// In any case they are not deployed in L2s.
exports.default = {
    Vault,
    wstETH: constants_1.ZERO_ADDRESS,
    BalancerMinter: constants_1.ZERO_ADDRESS,
    CanCallUserCheckpoint: true,
    Version,
};
