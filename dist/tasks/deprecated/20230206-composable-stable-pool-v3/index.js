"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const constants_1 = require("@helpers/constants");
const numbers_1 = require("@helpers/numbers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_2 = require("@src");
const hardhat_1 = require("hardhat");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.ProtocolFeePercentagesProvider, input.FactoryVersion, input.PoolVersion];
    const factory = await task.deployAndVerify('ComposableStablePoolFactory', args, from, force);
    if (task.mode === _src_1.TaskMode.LIVE) {
        // We also create a Pool using the factory and verify it, to let us compute their action IDs and so that future
        // Pools are automatically verified. We however don't run any of this code in CHECK mode, since we don't care about
        // the contracts deployed here. The action IDs will be checked to be correct via a different mechanism.
        // The pauseWindowDuration and bufferPeriodDuration will be filled in later, but we need to declare them here to
        // appease the type system. Those are constructor arguments, but automatically provided by the factory.
        const mockPoolArgs = {
            vault: input.Vault,
            protocolFeeProvider: input.ProtocolFeePercentagesProvider,
            name: 'DO NOT USE - Mock Composable Stable Pool',
            symbol: 'TEST',
            tokens: [input.WETH, input.BAL].sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            }),
            rateProviders: [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS],
            tokenRateCacheDurations: [0, 0],
            exemptFromYieldProtocolFeeFlags: [false, false],
            amplificationParameter: (0, numbers_1.bn)(100),
            swapFeePercentage: (0, numbers_1.bn)(1e12),
            pauseWindowDuration: undefined,
            bufferPeriodDuration: undefined,
            owner: constants_1.ZERO_ADDRESS,
            version: input.PoolVersion,
        };
        // This mimics the logic inside task.deploy
        if (force || !task.output({ ensure: false })['MockComposableStablePool']) {
            const poolCreationReceipt = await (await factory.create(mockPoolArgs.name, mockPoolArgs.symbol, mockPoolArgs.tokens, mockPoolArgs.amplificationParameter, mockPoolArgs.rateProviders, mockPoolArgs.tokenRateCacheDurations, mockPoolArgs.exemptFromYieldProtocolFeeFlags, mockPoolArgs.swapFeePercentage, mockPoolArgs.owner)).wait();
            const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
            const mockPoolAddress = event.args.pool;
            await (0, _src_2.saveContractDeploymentTransactionHash)(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
            await task.save({ MockComposableStablePool: mockPoolAddress });
        }
        const mockPool = await task.instanceAt('ComposableStablePool', task.output()['MockComposableStablePool']);
        // In order to verify the Pool's code, we need to complete its constructor arguments by computing the factory
        // provided arguments (pause durations).
        // The durations require knowing when the Pool was created, so we look for the timestamp of its creation block.
        const txHash = await (0, _src_2.getContractDeploymentTransactionHash)(mockPool.address, task.network);
        const tx = await hardhat_1.ethers.provider.getTransactionReceipt(txHash);
        const poolCreationBlock = await hardhat_1.ethers.provider.getBlock(tx.blockNumber);
        // With those and the period end times, we can compute the durations.
        const { pauseWindowEndTime, bufferPeriodEndTime } = await mockPool.getPausedState();
        mockPoolArgs.pauseWindowDuration = pauseWindowEndTime.sub(poolCreationBlock.timestamp);
        mockPoolArgs.bufferPeriodDuration = bufferPeriodEndTime
            .sub(poolCreationBlock.timestamp)
            .sub(mockPoolArgs.pauseWindowDuration);
        // We are now ready to verify the Pool
        await task.verify('ComposableStablePool', mockPool.address, [mockPoolArgs]);
    }
};
