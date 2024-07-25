import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
export declare function getSigners(): Promise<SignerWithAddress[]>;
export declare function getSigner(index?: number): Promise<SignerWithAddress>;
export declare function impersonate(address: string, balance?: BigNumber): Promise<SignerWithAddress>;
export declare function setBalance(address: string, balance: BigNumber): Promise<void>;
