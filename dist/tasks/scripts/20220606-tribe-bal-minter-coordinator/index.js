"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.AuthorizerAdaptor];
    await task.deployAndVerify('TribeBALMinterCoordinator', args, from, force);
};
