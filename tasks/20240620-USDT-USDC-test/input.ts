import { Task, TaskMode } from '@src';

export type ComposableStablePoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
  FactoryVersion: string;
  PoolVersion: string;
  DAI: string;
  USDT: string;
  USDC: string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new Task('20220725-protocol-fee-percentages-provider', TaskMode.READ_ONLY);
const DAI = new Task('00000000-tokens', TaskMode.READ_ONLY);
const USDT = new Task('00000000-tokens', TaskMode.READ_ONLY);
const USDC = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BaseVersion = { version: 6, deployment: '20240223-composable-stable-pool-v6' };


export default {
  Vault,
  ProtocolFeePercentagesProvider,
  FactoryVersion: JSON.stringify({ name: 'ComposableStablePoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'ComposableStablePool', ...BaseVersion }),
  DAI ,
  USDT,
  USDC
};
