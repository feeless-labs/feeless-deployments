"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const numbers_1 = require("@helpers/numbers");
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const maxYieldValue = (0, numbers_1.fp)(0.5);
const maxAUMValue = (0, numbers_1.fp)(0.5);
exports.default = {
    Vault,
    maxYieldValue,
    maxAUMValue,
};
