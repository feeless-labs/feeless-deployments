"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const GaugeAdder = new _src_1.Task('20220325-gauge-adder', _src_1.TaskMode.READ_ONLY);
const GaugeController = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY);
exports.default = {
    GaugeController,
    mainnet: {
        PreviousGaugeAdder: GaugeAdder.output({ network: 'mainnet' }).GaugeAdder,
    },
    goerli: {
        PreviousGaugeAdder: GaugeAdder.output({ network: 'goerli' }).GaugeAdder,
    },
};
