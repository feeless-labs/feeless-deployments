import { BigNumber, ContractReceipt } from 'ethers';
import { BigNumberish } from './numbers';
export declare const currentTimestamp: () => Promise<BigNumber>;
export declare const currentWeekTimestamp: () => Promise<BigNumber>;
export declare const fromNow: (seconds: number) => Promise<BigNumber>;
export declare const advanceTime: (seconds: BigNumberish) => Promise<void>;
export declare const advanceToTimestamp: (timestamp: BigNumberish) => Promise<void>;
export declare const setNextBlockTimestamp: (timestamp: BigNumberish) => Promise<void>;
export declare const lastBlockNumber: () => Promise<number>;
export declare const receiptTimestamp: (receipt: ContractReceipt | Promise<ContractReceipt>) => Promise<number>;
export declare const SECOND = 1;
export declare const MINUTE: number;
export declare const HOUR: number;
export declare const DAY: number;
export declare const WEEK: number;
export declare const MONTH: number;
export declare const timestampToString: (timestamp: number) => string;