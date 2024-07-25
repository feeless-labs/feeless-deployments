"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const relayerArgs = [input.Vault, input.wstETH];
    await task.deployAndVerify('LidoRelayer', relayerArgs, from, force);
};
