import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { BigNumberish } from '@ethersproject/bignumber';
export type NAry<T> = T | Array<T>;
export type Account = string | SignerWithAddress | Contract | {
    address: string;
};
export type TxParams = {
    from?: SignerWithAddress;
};
export declare enum PoolSpecialization {
    GeneralPool = 0,
    MinimalSwapInfoPool = 1,
    TwoTokenPool = 2
}
export type FundManagement = {
    sender: string;
    fromInternalBalance: boolean;
    recipient: string;
    toInternalBalance: boolean;
};
export declare enum SwapKind {
    GivenIn = 0,
    GivenOut = 1
}
export type SingleSwap = {
    poolId: string;
    kind: SwapKind;
    assetIn: string;
    assetOut: string;
    amount: BigNumberish;
    userData: string;
};
export type Swap = {
    kind: SwapKind;
    singleSwap: SingleSwap;
    limit: BigNumberish;
    deadline: BigNumberish;
};
export type BatchSwapStep = {
    poolId: string;
    assetInIndex: number;
    assetOutIndex: number;
    amount: BigNumberish;
    userData: string;
};
export type BatchSwap = {
    kind: SwapKind;
    swaps: BatchSwapStep[];
    assets: string[];
    funds: FundManagement;
    limits: BigNumberish[];
    deadline: BigNumberish;
};
export type SwapRequest = {
    kind: SwapKind;
    tokenIn: string;
    tokenOut: string;
    amount: BigNumberish;
    poolId: string;
    lastChangeBlock: BigNumberish;
    from: string;
    to: string;
    userData: string;
};
export type JoinPoolRequest = {
    assets: string[];
    maxAmountsIn: BigNumberish[];
    userData: string;
    fromInternalBalance: boolean;
};
export type ExitPoolRequest = {
    assets: string[];
    minAmountsOut: BigNumberish[];
    userData: string;
    toInternalBalance: boolean;
};
export declare enum UserBalanceOpKind {
    DepositInternal = 0,
    WithdrawInternal = 1,
    TransferInternal = 2,
    TransferExternal = 3
}
export type UserBalanceOp = {
    kind: UserBalanceOpKind;
    asset: string;
    amount: BigNumberish;
    sender: string;
    recipient: string;
};
export declare enum PoolBalanceOpKind {
    Withdraw = 0,
    Deposit = 1,
    Update = 2
}
export type PoolBalanceOp = {
    kind: PoolBalanceOpKind;
    poolId: string;
    token: string;
    amount: BigNumberish;
};
export declare enum GaugeType {
    LiquidityMiningCommittee = 0,
    veBAL = 1,
    Ethereum = 2,
    Polygon = 3,
    Arbitrum = 4,
    Optimism = 5,
    Gnosis = 6,
    ZkSync = 7
}
export type ManagedPoolParams = {
    name: string;
    symbol: string;
    assetManagers: string[];
};
export type ManagedPoolSettingsParams = {
    tokens: string[];
    normalizedWeights: BigNumberish[];
    swapFeePercentage: BigNumberish;
    swapEnabledOnStart: boolean;
    mustAllowlistLPs: boolean;
    managementAumFeePercentage: BigNumberish;
    aumFeeId: BigNumberish;
};
export declare enum ProtocolFee {
    SWAP = 0,
    FLASH_LOAN = 1,
    YIELD = 2,
    AUM = 3
}
