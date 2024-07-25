"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const BalancerMinter = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
const BaseVersion = { version: 2, deployment: '20230215-single-recipient-gauge-factory-v2' };
exports.default = {
    BalancerMinter,
    FactoryVersion: JSON.stringify({ name: 'SingleRecipientGaugeFactory', ...BaseVersion }),
    GaugeVersion: JSON.stringify({ name: 'SingleRecipientGauge', ...BaseVersion }),
};
