"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.InitialAllowedAddresses];
    await task.deployAndVerify('SmartWalletChecker', args, from, force);
};
