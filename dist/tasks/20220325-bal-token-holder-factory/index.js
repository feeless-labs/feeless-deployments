"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.BAL, input.Vault];
    await task.deployAndVerify('BALTokenHolderFactory', args, from, force);
};
