"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    // wstETH is only deployed on mainnet, kovan and goerli.
    mainnet: {
        wstETH: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
    },
    kovan: {
        wstETH: '0xa387b91e393cfb9356a460370842bc8dbb2f29af',
    },
    polygon: {
        wstETH: '0x0000000000000000000000000000000000000000',
    },
    arbitrum: {
        wstETH: '0x0000000000000000000000000000000000000000',
    },
    goerli: {
        wstETH: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
    },
};
