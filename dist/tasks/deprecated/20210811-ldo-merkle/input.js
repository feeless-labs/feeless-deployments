"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        Vault,
        ldoToken: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
    },
};
