import { Decimal } from 'decimal.js';
import { BigNumber } from 'ethers';
export { BigNumber };
export type BigNumberish = string | number | BigNumber;
export declare const decimal: (x: BigNumberish | Decimal) => Decimal;
export declare const fp: (x: BigNumberish | Decimal) => BigNumber;
export declare const toFp: (x: BigNumberish | Decimal) => Decimal;
export declare const fromFp: (x: BigNumberish | Decimal) => Decimal;
export declare const bn: (x: BigNumberish | Decimal) => BigNumber;
export declare const negate: (x: BigNumberish) => BigNumber;
export declare const maxUint: (e: number) => BigNumber;
export declare const maxInt: (e: number) => BigNumber;
export declare const minInt: (e: number) => BigNumber;
export declare const pct: (x: BigNumberish, pct: BigNumberish) => BigNumber;
export declare const max: (a: BigNumberish, b: BigNumberish) => BigNumber;
export declare const min: (a: BigNumberish, b: BigNumberish) => BigNumber;
export declare const bnSum: (bnArr: BigNumberish[]) => BigNumber;
export declare const arrayAdd: (arrA: BigNumberish[], arrB: BigNumberish[]) => BigNumber[];
export declare const arrayFpMul: (arrA: BigNumberish[], arrB: BigNumberish[]) => BigNumber[];
export declare const arraySub: (arrA: BigNumberish[], arrB: BigNumberish[]) => BigNumber[];
export declare const fpMul: (a: BigNumberish, b: BigNumberish) => BigNumber;
export declare const fpDiv: (a: BigNumberish, b: BigNumberish) => BigNumber;
export declare const divCeil: (x: BigNumber, y: BigNumber) => BigNumber;
export declare const FP_ZERO: BigNumber;
export declare const FP_ONE: BigNumber;
export declare const FP_100_PCT: BigNumber;
export declare function printGas(gas: number | BigNumber): string;
export declare function scaleUp(n: BigNumber, scalingFactor: BigNumber): BigNumber;
export declare function scaleDown(n: BigNumber, scalingFactor: BigNumber): BigNumber;
export declare function randomFromInterval(min: number, max: number): number;
