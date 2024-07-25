"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        BalancerMinter,
        // This contract is the "Mediator" contract listed at the below link:
        // https://docs.tokenbridge.net/eth-xdai-amb-bridge/multi-token-extension
        GnosisBridge: '0x88ad09518695c6c3712ac10a214be5109a655671',
    },
};
