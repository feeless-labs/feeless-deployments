import { Task, TaskMode } from '@src';

export type PoolRecoveryHelperDeployment = {
  Vault: string;
  InitialFactories: Array<string>;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const ComposableStablePoolFactoryTask = new Task('20220906-composable-stable-pool', TaskMode.READ_ONLY);
const ComposableStablePoolFactoryV2Task = new Task('20221122-composable-stable-pool-v2', TaskMode.READ_ONLY);
const WeightedPoolFactoryTask = new Task('20230320-weighted-pool-v4', TaskMode.READ_ONLY);

export default {
  Vault,
  iotatestnet: {
    InitialFactories: [
      ComposableStablePoolFactoryV2Task.output({ network: 'iotatestnet' }).ComposableStablePoolFactory,
      WeightedPoolFactoryTask.output({ network: 'iotatestnet' }).WeightedPoolFactory,
    ],
  }
};
