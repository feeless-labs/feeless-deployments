import { AsyncFunc } from 'mocha';
/**
 * This Mocha helper acts as a `beforeEach`, but executes the initializer
 * just once. It internally uses Hardhat Network and Ganache's snapshots
 * and revert instead of re-executing the initializer.
 *
 * Note that after the last test is run, the state doesn't get reverted.
 *
 * @param nameOrFn A title that's included in all the hooks that this helper uses.
 * @param maybeFn The initializer to be run before the tests.
 */
export declare function sharedBeforeEach(nameOrFn: string | AsyncFunc, maybeFn?: AsyncFunc): void;
