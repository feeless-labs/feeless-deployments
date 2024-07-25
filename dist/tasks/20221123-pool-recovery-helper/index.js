"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.InitialFactories];
    await task.deployAndVerify('PoolRecoveryHelper', args, from, force);
};
