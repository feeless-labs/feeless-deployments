"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    await task.deployAndVerify('ChildChainGaugeRewardHelper', [], from, force);
};
