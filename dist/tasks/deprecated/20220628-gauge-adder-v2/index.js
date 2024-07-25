"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const gaugeAdderArgs = [input.GaugeController, input.PreviousGaugeAdder];
    await task.deployAndVerify('GaugeAdder', gaugeAdderArgs, from, force);
};
