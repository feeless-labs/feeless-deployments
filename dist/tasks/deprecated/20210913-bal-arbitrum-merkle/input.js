"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    arbitrum: {
        Vault,
        balToken: '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8',
    },
};
