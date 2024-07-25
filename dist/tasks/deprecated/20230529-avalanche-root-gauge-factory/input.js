"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const numbers_1 = require("@helpers/numbers");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        Vault,
        BalancerMinter,
        // From https://docs.multichain.org/developer-guide/bridge-api-token-list-tx-status
        MultichainRouter: '0x765277eebeca2e31912c9946eae1021199b39c61',
        // The following values were taken from the router UI: https://app.multichain.org/#/router
        MinBridgeLimit: (0, numbers_1.fp)(2),
        MaxBridgeLimit: (0, numbers_1.fp)(725000), // Actual limit is 729,927.007299 - make slightly lower for a safety margin
    },
};
