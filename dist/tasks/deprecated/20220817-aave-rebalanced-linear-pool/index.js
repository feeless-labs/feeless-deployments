"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.BalancerQueries];
    await task.deployAndVerify('AaveLinearPoolFactory', args, from, force);
};
