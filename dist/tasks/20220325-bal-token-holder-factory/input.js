"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const TestBALTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY);
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    iotatestnet: {
        BAL: '0x31d4De6aA9FCB8239020eCf59281a3198d1b9c38',
    }
};
