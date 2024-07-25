"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.GaugeAdder, input.AuthorizerAdaptorEntrypoint];
    await task.deployAndVerify('L2GaugeCheckpointer', args, from, force);
};
