"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        BalancerMinter,
        // From https://static.matic.network/network/mainnet/v1/index.json, which is linked by the main documentation at
        // https://docs.polygon.technology/docs/develop/ethereum-polygon/pos/deployment. Note that the docs instruct to use
        // the Proxy addresses.
        // These values match the ones hardcoded in the original Curve contracts (deployment addresses can be found at
        // https://curve.readthedocs.io/ref-addresses.html#pools-and-gauges, e.g. 0x060e386eCfBacf42Aa72171Af9EFe17b3993fC4F)
        PolygonRootChainManager: '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77',
        PolygonERC20Predicate: '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
    },
};
