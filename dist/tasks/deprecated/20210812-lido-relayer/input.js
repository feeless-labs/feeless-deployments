"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        Vault,
        wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    },
    kovan: {
        Vault,
        wstETH: '0xA387B91e393cFB9356A460370842BC8dBB2F29aF',
    },
    goerli: {
        Vault,
        wstETH: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
    },
};