"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        BalancerMinter,
        PolygonZkEVMBridge: '0x2a3dd3eb832af982ec71669e178424b10dca2ede',
    },
};
