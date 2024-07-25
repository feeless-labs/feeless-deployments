import { ethers } from 'hardhat';
import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { getContractDeploymentTransactionHash, saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { WeightedPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedPoolDeployment;

  const args = [input.Vault, input.ProtocolFeePercentagesProvider, input.FactoryVersion, input.PoolVersion];
  const factory = await task.deployAndVerify('WeightedPoolFactory', args, from, force);

  if (task.mode === TaskMode.LIVE) {
    // We also create a Pool using the factory and verify it, to let us compute their action IDs and so that future
    // Pools are automatically verified. We however don't run any of this code in CHECK mode, since we don't care about
    // the contracts deployed here. The action IDs will be checked to be correct via a different mechanism.
    const newWeightedPoolParams = {
      name: input.NAME,
      symbol: input.SYMBOL,
      tokens: [input.WETH, input.BAL].sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      }),
      normalizedWeights: [fp(0.8), fp(0.2)],
      rateProviders: [ZERO_ADDRESS, ZERO_ADDRESS],
      assetManagers: [ZERO_ADDRESS, ZERO_ADDRESS],
      swapFeePercentage: bn(1e12),
    };

    // The pauseWindowDuration and bufferPeriodDuration will be filled in later, but we need to declare them here to
    // appease the type system. Those are constructor arguments, but automatically provided by the factory.
    const realPoolArgs = {
      params: newWeightedPoolParams,
      vault: input.Vault,
      protocolFeeProvider: input.ProtocolFeePercentagesProvider,
      pauseWindowDuration: undefined,
      bufferPeriodDuration: undefined,
      owner: ZERO_ADDRESS,
      version: input.PoolVersion,
    };

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['FLSIOTAAWeightedPool']) {
      const poolCreationReceipt = await (
        await factory.create(
          realPoolArgs.params.name,
          realPoolArgs.params.symbol,
          realPoolArgs.params.tokens,
          realPoolArgs.params.normalizedWeights,
          realPoolArgs.params.rateProviders,
          realPoolArgs.params.swapFeePercentage,
          realPoolArgs.owner,
          ZERO_BYTES32
        )
      ).wait();
      const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ FLSIOTAAWeightedPool: mockPoolAddress });
    }

    const realPool = await task.instanceAt('WeightedPool', task.output()['FLSIOTAAWeightedPool']);

     // Recupera la poolId dal contratto della pool
     const poolId = await realPool.getPoolId();
     console.log(`Pool ID: ${poolId}`);
 
     // Salva la poolId nel task output
     await task.save({ FLSIOTAAWeightedPoolId: poolId });

    // In order to verify the Pool's code, we need to complete its constructor arguments by computing the factory
    // provided arguments (pause durations).

    // The durations require knowing when the Pool was created, so we look for the timestamp of its creation block.
    const txHash = await getContractDeploymentTransactionHash(realPool.address, task.network);
    const tx = await ethers.provider.getTransactionReceipt(txHash);
    const poolCreationBlock = await ethers.provider.getBlock(tx.blockNumber);

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
