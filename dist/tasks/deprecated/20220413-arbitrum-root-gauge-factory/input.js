"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        Vault,
        BalancerMinter,
        // From https://developer.offchainlabs.com/docs/useful_addresses#token-bridge
        GatewayRouter: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef',
        // The following values (along with the GatewayRouter) were retrieved at deployment time from Curve's
        // arbitrum-tricrypto gauge, located at 0x9044E12fB1732f88ed0c93cfa5E9bB9bD2990cE5.
        GasLimit: 1000000,
        GasPrice: 1990000000,
        MaxSubmissionCost: 10000000000000,
    },
};
