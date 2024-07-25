"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    iotatestnet: {
        // TribeDAO's contract, from https://vote.balancer.fi/#/proposal/0xece898cf86f930dd150f622a4ccb1fa41900e67b3cebeb4fc7c5a4acbb0e0148
        InitialAllowedAddresses: [],
    },
    goerli: {
        InitialAllowedAddresses: [],
    },
    sepolia: {
        InitialAllowedAddresses: [],
    },
};
