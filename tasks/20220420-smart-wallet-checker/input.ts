import { Task, TaskMode } from '@src';

export type SmartWalletCheckerDeployment = {
  Vault: string;
  InitialAllowedAddresses: string[];
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);

export default {
  Vault,
  iotatestnet: {
    // TribeDAO's contract, from https://vote.balancer.fi/#/proposal/0xece898cf86f930dd150f622a4ccb1fa41900e67b3cebeb4fc7c5a4acbb0e0148
    InitialAllowedAddresses: [],
  },
  goerli: {
    InitialAllowedAddresses: [],
  },
  sepolia: {
    InitialAllowedAddresses: [],
  },
};