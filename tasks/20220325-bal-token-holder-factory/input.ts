import { Task, TaskMode } from '@src';

export type BalTokenHolderFactoryDelegationDeployment = {
  Vault: string;
  BAL: string;
};

const TestBALTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY);
const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  Vault,
  iotatestnet: {
    BAL: '0x31d4De6aA9FCB8239020eCf59281a3198d1b9c38',
  }
};
