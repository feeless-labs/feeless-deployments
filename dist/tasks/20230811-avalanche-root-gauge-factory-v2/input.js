"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
// Ethereum BAL proxy https://etherscan.io/address/0xE15bCB9E0EA69e6aB9FA080c4c4A5632896298C3
// is wired to BAL token in AVAX: https://snowtrace.io/address/0xE15bCB9E0EA69e6aB9FA080c4c4A5632896298C3
const BALProxy = '0xE15bCB9E0EA69e6aB9FA080c4c4A5632896298C3';
exports.default = {
    mainnet: {
        Vault,
        BalancerMinter,
        BALProxy,
    },
};
