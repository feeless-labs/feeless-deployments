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
const numbers_1 = require("@helpers/numbers");
const _src_1 = require("@src");
const constants_1 = require("@helpers/constants");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const hardhat_1 = require("hardhat");
const _src_2 = require("@src");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [
        input.Vault,
        input.ProtocolFeePercentagesProvider,
        input.BalancerQueries,
        input.FactoryVersion,
        input.PoolVersion,
        input.InitialPauseWindowDuration,
        input.BufferPeriodDuration,
        input.EulerProtocol,
    ];
    const factory = await task.deployAndVerify('EulerLinearPoolFactory', args, from, force);
    if (task.mode === _src_1.TaskMode.LIVE) {
        // We also create a Pool using the factory and verify it, to let us compute their action IDs and so that future
        // Pools are automatically verified. We however don't run any of this code in CHECK mode, since we don't care about
        // the contracts deployed here. The action IDs will be checked to be correct via a different mechanism.
        // EulerLinearPools require an Euler Token
        const mockEulerTokenArgs = ['DO NOT USE - Mock Euler Token', 'TEST', 18, input.WETH];
        const mockEulerToken = await task.deployAndVerify('MockEulerToken', mockEulerTokenArgs, from, force);
        // The assetManager, pauseWindowDuration and bufferPeriodDuration will be filled in later, but we need to declare
        // them here to appease the type system. Those are constructor arguments, but automatically provided by the factory.
        const mockPoolArgs = {
            vault: input.Vault,
            name: 'DO NOT USE - Mock Linear Pool',
            symbol: 'TEST',
            mainToken: input.WETH,
            wrappedToken: mockEulerToken.address,
            assetManager: undefined,
            upperTarget: 0,
            pauseWindowDuration: undefined,
            bufferPeriodDuration: undefined,
            swapFeePercentage: (0, numbers_1.bn)(1e12),
            owner: constants_1.ZERO_ADDRESS,
            version: input.PoolVersion,
        };
        // This mimics the logic inside task.deploy
        if (force || !task.output({ ensure: false })['MockEulerLinearPool']) {
            const PROTOCOL_ID = 0;
            const poolCreationReceipt = await (await factory.create(mockPoolArgs.name, mockPoolArgs.symbol, mockPoolArgs.mainToken, mockPoolArgs.wrappedToken, mockPoolArgs.upperTarget, mockPoolArgs.swapFeePercentage, mockPoolArgs.owner, PROTOCOL_ID)).wait();
            const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
            const mockPoolAddress = event.args.pool;
            await (0, _src_2.saveContractDeploymentTransactionHash)(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
            await task.save({ MockEulerLinearPool: mockPoolAddress });
        }
        const mockPool = await task.instanceAt('EulerLinearPool', task.output()['MockEulerLinearPool']);
        // In order to verify the Pool's code, we need to complete its constructor arguments by computing the factory
        // provided arguments (asset manager and pause durations).
        // The asset manager is found by querying the Vault
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, task.network);
        const vault = await vaultTask.deployedInstance('Vault');
        const { assetManager: assetManagerAddress } = await vault.getPoolTokenInfo(await mockPool.getPoolId(), input.WETH);
        mockPoolArgs.assetManager = assetManagerAddress;
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
        await task.verify('EulerLinearPool', mockPool.address, [mockPoolArgs]);
        // We can also verify the Asset Manager
        await task.verify('EulerLinearPoolRebalancer', assetManagerAddress, [
            input.Vault,
            input.BalancerQueries,
            input.EulerProtocol,
        ]);
    }
};
