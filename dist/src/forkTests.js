"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeForkTest = void 0;
const hardhat_1 = __importDefault(require("hardhat"));
function describeForkTest(name, forkNetwork, blockNumber, callback) {
    describe(name, () => {
        _describeBody(forkNetwork, blockNumber, callback);
    });
}
exports.describeForkTest = describeForkTest;
describeForkTest.only = function (name, forkNetwork, blockNumber, callback) {
    // eslint-disable-next-line mocha-no-only/mocha-no-only
    describe.only(name, () => {
        _describeBody(forkNetwork, blockNumber, callback);
    });
};
describeForkTest.skip = function (name, forkNetwork, blockNumber, callback) {
    describe.skip(name, () => {
        _describeBody(forkNetwork, blockNumber, callback);
    });
};
function _describeBody(forkNetwork, blockNumber, callback) {
    before('setup fork test', async () => {
        const forkingNetworkName = Object.keys(hardhat_1.default.config.networks).find((networkName) => networkName === forkNetwork);
        if (!forkingNetworkName)
            throw Error(`Could not find a config for network ${forkNetwork} to be forked`);
        const forkingNetworkConfig = hardhat_1.default.config.networks[forkingNetworkName];
        if (!forkingNetworkConfig.url)
            throw Error(`Could not find a RPC url in network config for ${forkingNetworkName}`);
        await hardhat_1.default.network.provider.request({
            method: 'hardhat_reset',
            params: [{ forking: { jsonRpcUrl: forkingNetworkConfig.url, blockNumber } }],
        });
        const config = hardhat_1.default.network.config;
        config.forking = { enabled: true, blockNumber, url: forkingNetworkConfig.url, httpHeaders: {} };
    });
    callback();
}
