import { ZERO_ADDRESS } from '@helpers/constants';
import { Task, TaskMode } from '@src';

export type BatchRelayerDeployment = {
  Vault: string;
  wstETH: string;
  BalancerMinter: string;
  CanCallUserCheckpoint: boolean;
  Version: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const BalancerMinter = new Task('20220325-gauge-controller', TaskMode.READ_ONLY);

const version = {
  name: 'BatchRelayer',
  version: '6',
  deployment: '20231031-batch-relayer-v6',
};

export default {
  Vault,
  Version: JSON.stringify(version),
  // wstETH and BalancerMinter are only deployed on mainnet and testnets.
  // On L2s, we can use the L2BalancerPseudoMinter, which has the same interface as BalancerMinter.
  iotatestnet: {
    wstETH: '0x2a8Ee1A646ee3bc6C204e42dBabB8710D7b5ac88',
    BalancerMinter,
    CanCallUserCheckpoint: false,
  }
};
