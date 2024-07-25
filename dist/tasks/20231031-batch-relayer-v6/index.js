"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const relayerLibraryArgs = [
        input.Vault,
        input.wstETH,
        input.BalancerMinter,
        input.CanCallUserCheckpoint,
        input.Version,
    ];
    const relayerLibrary = await task.deployAndVerify('BatchRelayerLibrary', relayerLibraryArgs, from, force);
    // The relayer library automatically also deploys the query library, and then the relayer itself: we must verify them
    const relayer = await task.instanceAt('BalancerRelayer', relayerLibrary.getEntrypoint());
    const queryLibrary = await relayer.getQueryLibrary();
    const relayerAddress = await relayer.address;
    const relayerArgs = [input.Vault, relayerLibrary.address, queryLibrary, input.Version]; // See BalancerRelayer's constructor
    await task.verify('BalancerRelayer', relayerAddress, relayerArgs);
    await task.verify('BatchRelayerQueryLibrary', queryLibrary, [input.Vault]);
    await task.save({ BatchRelayerQueryLibrary: queryLibrary });
    await task.save({ BalancerRelayer: relayerAddress });
};
