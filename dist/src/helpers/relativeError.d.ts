import { Decimal } from 'decimal.js';
import { BigNumberish } from './numbers';
export declare function expectEqualWithError(actual: BigNumberish, expected: BigNumberish, error?: BigNumberish): void;
export declare function expectArrayEqualWithError(actual: Array<BigNumberish>, expected: Array<BigNumberish>, error?: BigNumberish): void;
export declare function expectLessThanOrEqualWithError(actual: BigNumberish, expected: BigNumberish, error?: BigNumberish): void;
export declare function expectRelativeError(actual: Decimal, expected: Decimal, maxRelativeError: Decimal): void;
