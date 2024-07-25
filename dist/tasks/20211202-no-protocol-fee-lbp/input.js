"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const WETH = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
const BAL = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    WETH,
    BAL,
};
