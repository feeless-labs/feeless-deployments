export declare const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
export declare const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export declare const tokens: string[];
export declare const amplificationParameter: import("@helpers/numbers").BigNumber;
export declare const swapFeePercentage: import("@helpers/numbers").BigNumber;
export declare const initialBalanceDAI: import("@helpers/numbers").BigNumber;
export declare const initialBalanceUSDC: import("@helpers/numbers").BigNumber;
export declare const initialBalances: import("@helpers/numbers").BigNumber[];
export declare const rateProviders: string[];
export declare const cacheDurations: import("@helpers/numbers").BigNumber[];
export declare const exemptFlags: boolean[];
export declare enum PoolKind {
    WEIGHTED = 0,
    LEGACY_STABLE = 1,
    COMPOSABLE_STABLE = 2,
    COMPOSABLE_STABLE_V2 = 3,
    STABLE_PHANTOM = 4
}
