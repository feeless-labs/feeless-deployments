import { AsyncFunc } from 'mocha';
import { NAry } from './models/types/types';
import { BigNumberish } from './numbers';
declare global {
    export namespace Chai {
        interface Assertion {
            zero: void;
            zeros: void;
            zeroAddress: void;
            equalFp(value: BigNumberish): void;
            lteWithError(value: NAry<BigNumberish>, error?: BigNumberish): void;
            equalWithError(value: NAry<BigNumberish>, error?: BigNumberish): void;
            almostEqual(value: NAry<BigNumberish>, error?: BigNumberish): void;
            almostEqualFp(value: NAry<BigNumberish>, error?: BigNumberish): void;
        }
    }
    function sharedBeforeEach(fn: AsyncFunc): void;
    function sharedBeforeEach(name: string, fn: AsyncFunc): void;
}
