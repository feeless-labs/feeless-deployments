"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    arbitrum: {
        Vault,
        rewardToken: '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
    },
};
