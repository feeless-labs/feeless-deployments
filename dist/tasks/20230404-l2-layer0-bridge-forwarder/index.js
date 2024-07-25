"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    await task.deployAndVerify('L2LayerZeroBridgeForwarder', [input.Vault], from, force);
};
