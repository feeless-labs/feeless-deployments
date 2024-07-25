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
const _src_2 = require("@src");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const addRemoveTokenLib = await task.deployAndVerify('ManagedPoolAddRemoveTokenLib', [], from, force);
    const circuitBreakerLib = await task.deployAndVerify('CircuitBreakerLib', [], from, force);
    const libs = { CircuitBreakerLib: circuitBreakerLib.address };
    const ammLib = await task.deployAndVerify('ManagedPoolAmmLib', [], from, force, libs);
    const math = await task.deployAndVerify('ExternalWeightedMath', [], from, force);
    const recoveryModeHelper = await task.deployAndVerify('RecoveryModeHelper', [input.Vault], from, force);
    const args = [
        input.Vault,
        input.ProtocolFeePercentagesProvider,
        math.address,
        recoveryModeHelper.address,
        input.FactoryVersion,
        input.PoolVersion,
        input.InitialPauseWindowDuration,
        input.BufferPeriodDuration,
    ];
    const factory = await task.deployAndVerify('ManagedPoolFactory', args, from, force, {
        CircuitBreakerLib: circuitBreakerLib.address,
        ManagedPoolAddRemoveTokenLib: addRemoveTokenLib.address,
        ManagedPoolAmmLib: ammLib.address,
    });
    if (task.mode === _src_2.TaskMode.LIVE) {
        // We also create a Pool using the factory and verify it, to let us compute their action IDs and so that future
        // Pools are automatically verified. We however don't run any of this code in CHECK mode, since we don't care about
        // the contracts deployed here. The action IDs will be checked to be correct via a different mechanism.
        const newManagedPoolParams = {
            name: 'DO NOT USE - Mock Managed Pool',
            symbol: 'TEST',
            assetManagers: [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS],
        };
        const newManagedPoolSettings = {
            tokens: [input.WETH, input.BAL].sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            }),
            normalizedWeights: [(0, numbers_1.fp)(0.8), (0, numbers_1.fp)(0.2)],
            swapFeePercentage: (0, numbers_1.bn)(1e12),
            swapEnabledOnStart: true,
            mustAllowlistLPs: false,
            managementAumFeePercentage: (0, numbers_1.fp)(0.5),
            aumFeeId: 2,
        };
        const newManagedPoolConfig = {
            vault: input.Vault,
            protocolFeeProvider: input.ProtocolFeePercentagesProvider,
            weightedMath: await factory.getWeightedMath(),
            recoveryModeHelper: await factory.getRecoveryModeHelper(),
            pauseWindowDuration: undefined,
            bufferPeriodDuration: undefined,
            version: input.PoolVersion,
        };
        // The pauseWindowDuration and bufferPeriodDuration will be filled in later, but we need to declare them here to
        // appease the type system. Those are constructor arguments, but automatically provided by the factory.
        const mockPoolArgs = {
            params: newManagedPoolParams,
            config: newManagedPoolConfig,
            settings: newManagedPoolSettings,
            owner: constants_1.ZERO_ADDRESS,
            salt: constants_1.ZERO_BYTES32,
        };
        // This mimics the logic inside task.deploy
        if (force || !task.output({ ensure: false })['MockManagedPool']) {
            const poolCreationReceipt = await (await factory.create(mockPoolArgs.params, mockPoolArgs.settings, mockPoolArgs.owner, mockPoolArgs.salt)).wait();
            const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
            const mockPoolAddress = event.args.pool;
            await (0, _src_1.saveContractDeploymentTransactionHash)(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
            await task.save({ MockManagedPool: mockPoolAddress });
        }
        const mockPool = await task.instanceAt('ManagedPool', task.output()['MockManagedPool']);
        // In order to verify the Pool's code, we need to complete its constructor arguments by computing the factory
        // provided arguments (pause durations).
        // The durations require knowing when the Pool was created, so we look for the timestamp of its creation block.
        const txHash = await (0, _src_1.getContractDeploymentTransactionHash)(mockPool.address, task.network);
        const tx = await hardhat_1.ethers.provider.getTransactionReceipt(txHash);
        const poolCreationBlock = await hardhat_1.ethers.provider.getBlock(tx.blockNumber);
        // With those and the period end times, we can compute the durations.
        const { pauseWindowEndTime, bufferPeriodEndTime } = await mockPool.getPausedState();
        mockPoolArgs.config.pauseWindowDuration = pauseWindowEndTime.sub(poolCreationBlock.timestamp);
        mockPoolArgs.config.bufferPeriodDuration = bufferPeriodEndTime
            .sub(poolCreationBlock.timestamp)
            .sub(mockPoolArgs.config.pauseWindowDuration);
        // We are now ready to verify the Pool
        await task.verify('ManagedPool', mockPool.address, [
            mockPoolArgs.params,
            mockPoolArgs.config,
            mockPoolArgs.settings,
            mockPoolArgs.owner,
        ]);
    }
};
