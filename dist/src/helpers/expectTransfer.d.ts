import { BigNumberish, ContractReceipt } from 'ethers';
import { Account } from './models/types/types';
export declare function expectTransferEvent(receipt: ContractReceipt, args: {
    from?: string;
    to?: string;
    value?: BigNumberish;
}, token: Account): any;
