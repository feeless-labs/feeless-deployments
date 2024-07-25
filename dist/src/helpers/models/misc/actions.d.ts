import { Contract } from 'ethers';
import { Interface } from 'ethers/lib/utils';
export declare const actionId: (instance: Contract, method: string, contractInterface?: Interface) => Promise<string>;
