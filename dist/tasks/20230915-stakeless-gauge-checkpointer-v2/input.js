"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const GaugeAdder = new _src_1.Task('20230519-gauge-adder-v4', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptorEntrypoint = new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.READ_ONLY);
exports.default = {
    GaugeAdder,
    AuthorizerAdaptorEntrypoint,
};
