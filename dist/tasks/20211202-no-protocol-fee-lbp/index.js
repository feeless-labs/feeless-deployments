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
const _src_1 = require("@src");
const numbers_1 = require("@helpers/numbers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_2 = require("@src");
const constants_1 = require("@helpers/constants");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Vault];
    const factory = await task.deployAndVerify('NoProtocolFeeLiquidityBootstrappingPoolFactory', args, from, force);
    if (task.mode === _src_1.TaskMode.LIVE) {
        // We also create a Pool using the factory and verify it, to let us compute their action IDs and so that future
        // Pools are automatically verified. We however don't run any of this code in CHECK mode, since we don't care about
        // the contracts deployed here. The action IDs will be checked to be correct via a different mechanism.
        const newPoolParams = {
            name: 'DO NOT USE - Mock LiquidityBootstrappingPool Pool',
            symbol: 'TEST',
            tokens: [input.WETH, input.BAL].sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            }),
            weights: [(0, numbers_1.fp)(0.8), (0, numbers_1.fp)(0.2)],
            swapFeePercentage: (0, numbers_1.bn)(1e12),
            swapEnabledOnStart: true,
            owner: constants_1.ZERO_ADDRESS,
        };
        // This mimics the logic inside task.deploy
        if (force || !task.output({ ensure: false })['MockLiquidityBootstrappingPool']) {
            const poolCreationReceipt = await (await factory.create(newPoolParams.name, newPoolParams.symbol, newPoolParams.tokens, newPoolParams.weights, newPoolParams.swapFeePercentage, newPoolParams.owner, newPoolParams.swapEnabledOnStart)).wait();
            const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
            const mockPoolAddress = event.args.pool;
            await (0, _src_2.saveContractDeploymentTransactionHash)(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
            await task.save({ MockLiquidityBootstrappingPool: mockPoolAddress });
        }
        const mockPool = await task.instanceAt('LiquidityBootstrappingPool', task.output()['MockLiquidityBootstrappingPool']);
        // In order to verify the Pool's code, we need to complete its constructor arguments by computing the factory
        // provided arguments (pause durations).
        // The durations require knowing when the Pool was created, so we look for the timestamp of its creation block.
        const txHash = await (0, _src_2.getContractDeploymentTransactionHash)(mockPool.address, task.network);
        const tx = await hardhat_1.ethers.provider.getTransactionReceipt(txHash);
        const poolCreationBlock = await hardhat_1.ethers.provider.getBlock(tx.blockNumber);
        // With those and the period end times, we can compute the durations.
        const { pauseWindowEndTime, bufferPeriodEndTime } = await mockPool.getPausedState();
        const pauseWindowDuration = pauseWindowEndTime.sub(poolCreationBlock.timestamp);
        const bufferPeriodDuration = bufferPeriodEndTime.sub(poolCreationBlock.timestamp).sub(pauseWindowDuration);
        // We are now ready to verify the Pool
        await task.verify('LiquidityBootstrappingPool', mockPool.address, [
            input.Vault,
            newPoolParams.name,
            newPoolParams.symbol,
            newPoolParams.tokens,
            newPoolParams.weights,
            newPoolParams.swapFeePercentage,
            pauseWindowDuration,
            bufferPeriodDuration,
            newPoolParams.owner,
            newPoolParams.swapEnabledOnStart,
        ]);
    }
};
