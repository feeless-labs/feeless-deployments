"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const rateProviderArgs = [input.wstETH];
    await task.deployAndVerify('WstETHRateProvider', rateProviderArgs, from, force);
};
