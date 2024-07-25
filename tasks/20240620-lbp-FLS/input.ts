import { Task, TaskMode } from '@src';

export type NoProtocolFeeLiquidityBootstrappingPoolDeployment = {
  Vault: string;
  WETH: string;
  BAL: string;
  NAME : string;
  SYMBOL: string;
  POOLNAME : string;
};

const Vault = new Task('20210418-vault', TaskMode.READ_ONLY);
const WETH = new Task('00000000-tokens', TaskMode.READ_ONLY);
const BAL = new Task('00000000-tokens', TaskMode.READ_ONLY);

const NAME = "FLSLBP";
const SYMBOL = "FLSLBP";
const POOLNAME = "FLS/LBP Liquidity";

export default {
  Vault,
  WETH,
  BAL,
  NAME,
  SYMBOL,
  POOLNAME
};
