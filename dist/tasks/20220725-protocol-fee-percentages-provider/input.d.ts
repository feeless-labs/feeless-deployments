import { Task } from '@src';
import { BigNumber } from 'ethers';
export type ProtocolFeePercentagesProviderDeployment = {
    Vault: string;
    maxYieldValue: BigNumber;
    maxAUMValue: BigNumber;
};
declare const _default: {
    Vault: Task;
    maxYieldValue: BigNumber;
    maxAUMValue: BigNumber;
};
export default _default;
