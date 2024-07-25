"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const GaugeController = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptorEntrypoint = new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.READ_ONLY);
exports.default = {
    AuthorizerAdaptorEntrypoint,
    mainnet: {
        GaugeController,
    },
    goerli: {
        GaugeController,
    },
    sepolia: {
        GaugeController,
    },
};
