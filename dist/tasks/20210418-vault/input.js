"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const time_1 = require("@helpers/time");
const Authorizer = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY);
const WETH = new _src_1.Task('00000000-tokens', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Authorizer,
    pauseWindowDuration: 3 * time_1.MONTH,
    bufferPeriodDuration: time_1.MONTH,
    WETH,
};
