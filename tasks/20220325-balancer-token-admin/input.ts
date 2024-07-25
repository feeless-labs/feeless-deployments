import { Task, TaskMode } from '@src';

export type BalancerTokenAdminDeployment = {
  BAL: string;
  Vault: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  Vault,
  iotatestnet: {
    BAL: '0x1D148Eb4C213e560a6bad71536b96AC5D6F1cDE3',
  }
};
