import { Task, TaskMode } from '@src';
import { ethers } from 'hardhat';

export type WeightedPoolDeployment = {
  BAL: String;
  DAI: String;
  SYMBOL: string;
  NAME: string;
  POOLNAME: string;
  FactoryVersion: string;
  PoolVersion: string;
  Vault : String
  ProtocolFeePercentagesProvider : String
};

const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);
const DAI = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BaseVersion = { version: 4, deployment: '20230320-weighted-pool-v4' };

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new Task('20220725-protocol-fee-percentages-provider', TaskMode.READ_ONLY);

const NAME = "ETHBTC";
const SYMBOL = "ETHBTC";
const POOLNAME = "ETH/BTC Weighted Pools";

export default {
  BAL,
  DAI,
  SYMBOL,
  NAME,
  POOLNAME,
  FactoryVersion: JSON.stringify({ name: 'WeightedPoolFactory', ...BaseVersion }),
  PoolVersion: JSON.stringify({ name: 'WeightedPool', ...BaseVersion }),
  Vault,
  ProtocolFeePercentagesProvider 
};