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
const hardhat_1 = require("hardhat");
const constants_1 = require("@helpers/constants");
const numbers_1 = require("@helpers/numbers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault, input.ProtocolFeePercentagesProvider, input.FactoryVersion, input.PoolVersion];
    const factory = await task.deployAndVerify('WeightedPoolFactory', args, from, force);
    if (task.mode === _src_2.TaskMode.LIVE) {
        // We also create a Pool using the factory and verify it, to let us compute their action IDs and so that future
        // Pools are automatically verified. We however don't run any of this code in CHECK mode, since we don't care about
        // the contracts deployed here. The action IDs will be checked to be correct via a different mechanism.
        const newWeightedPoolParams = {
            name: input.NAME,
            symbol: input.SYMBOL,
            tokens: [input.BAL, input.DAI].sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            }),
            normalizedWeights: [(0, numbers_1.fp)(0.3), (0, numbers_1.fp)(0.7)],
            rateProviders: [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS],
            assetManagers: [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS],
            swapFeePercentage: (0, numbers_1.bn)(1e12),
        };
        // The pauseWindowDuration and bufferPeriodDuration will be filled in later, but we need to declare them here to
        // appease the type system. Those are constructor arguments, but automatically provided by the factory.
        const realPoolArgs = {
            params: newWeightedPoolParams,
            vault: input.Vault,
            protocolFeeProvider: input.ProtocolFeePercentagesProvider,
            pauseWindowDuration: undefined,
            bufferPeriodDuration: undefined,
            owner: constants_1.ZERO_ADDRESS,
            version: input.PoolVersion,
        };
        // This mimics the logic inside task.deploy
        if (force || !task.output({ ensure: false })['FLSDAIWeightedPool']) {
            const poolCreationReceipt = await (await factory.create(realPoolArgs.params.name, realPoolArgs.params.symbol, realPoolArgs.params.tokens, realPoolArgs.params.normalizedWeights, realPoolArgs.params.rateProviders, realPoolArgs.params.swapFeePercentage, realPoolArgs.owner, constants_1.ZERO_BYTES32)).wait();
            const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
            const mockPoolAddress = event.args.pool;
            await (0, _src_1.saveContractDeploymentTransactionHash)(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
            await task.save({ FLSDAIWeightedPool: mockPoolAddress });
        }
        const realPool = await task.instanceAt('WeightedPool', task.output()['FLSDAIWeightedPool']);
        // Recupera la poolId dal contratto della pool
        const poolId = await realPool.getPoolId();
        console.log(`Pool ID: ${poolId}`);
        // Salva la poolId nel task output
        await task.save({ FLSDAIWeightedPoolId: poolId });
        // In order to verify the Pool's code, we need to complete its constructor arguments by computing the factory
        // provided arguments (pause durations).
        // The durations require knowing when the Pool was created, so we look for the timestamp of its creation block.
        const txHash = await (0, _src_1.getContractDeploymentTransactionHash)(realPool.address, task.network);
        const tx = await hardhat_1.ethers.provider.getTransactionReceipt(txHash);
        const poolCreationBlock = await hardhat_1.ethers.provider.getBlock(tx.blockNumber);
        // With those and the period end times, we can compute the durations.
        const { pauseWindowEndTime, bufferPeriodEndTime } = await realPool.getPausedState();
        realPoolArgs.pauseWindowDuration = pauseWindowEndTime.sub(poolCreationBlock.timestamp);
        realPoolArgs.bufferPeriodDuration = bufferPeriodEndTime
            .sub(poolCreationBlock.timestamp)
            .sub(realPoolArgs.pauseWindowDuration);
        // We are now ready to verify the Pool
        await task.verify('WeightedPool', realPool.address, [
            realPoolArgs.params,
            realPoolArgs.vault,
            realPoolArgs.protocolFeeProvider,
            realPoolArgs.pauseWindowDuration,
            realPoolArgs.bufferPeriodDuration,
            realPoolArgs.owner,
            realPoolArgs.version,
        ]);
    }
};
