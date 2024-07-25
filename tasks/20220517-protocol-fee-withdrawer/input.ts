import { Task, TaskMode } from '@src';

export type ProtocolFeesWithdrawerDeployment = {
  Vault: string;
  InitialDeniedTokens: string[];
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  Vault,
  iotatestnet: {
    InitialDeniedTokens: [
    ],
  },
  polygon: {
    InitialDeniedTokens: [],
  },
  arbitrum: {
    InitialDeniedTokens: [],
  },
  optimism: {
    InitialDeniedTokens: [],
  },
  gnosis: {
    InitialDeniedTokens: [],
  },
  bsc: {
    InitialDeniedTokens: [],
  },
  avalanche: {
    InitialDeniedTokens: [],
  },
  zkevm: {
    InitialDeniedTokens: [],
  },
  base: {
    InitialDeniedTokens: [],
  },
  goerli: {
    InitialDeniedTokens: [],
  },
  sepolia: {
    InitialDeniedTokens: [],
  },
};
