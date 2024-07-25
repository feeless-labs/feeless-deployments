"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const relayerLibraryArgs = [input.Vault, input.wstETH];
    const relayerLibrary = await task.deployAndVerify('BatchRelayerLibrary', relayerLibraryArgs, from, force);
    // The relayer library automatically also deploys the relayer itself: we must verify it
    const relayer = await relayerLibrary.getEntrypoint();
    const relayerArgs = [input.Vault, relayerLibrary.address]; // See BalancerRelayer's constructor
    await task.verify('BalancerRelayer', relayer, relayerArgs);
    await task.save({ BalancerRelayer: relayer });
};
