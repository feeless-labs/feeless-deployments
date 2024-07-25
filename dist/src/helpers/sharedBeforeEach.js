"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedBeforeEach = void 0;
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const SNAPSHOTS = [];
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
function sharedBeforeEach(nameOrFn, maybeFn) {
    const name = typeof nameOrFn === 'string' ? nameOrFn : undefined;
    const fn = typeof nameOrFn === 'function' ? nameOrFn : maybeFn;
    let initialized = false;
    beforeEach(wrapWithTitle(name, 'Running shared before each or reverting'), async function () {
        if (!initialized) {
            const prevSnapshot = SNAPSHOTS.pop();
            if (prevSnapshot !== undefined) {
                await prevSnapshot.restore();
                SNAPSHOTS.push(await (0, hardhat_network_helpers_1.takeSnapshot)());
            }
            await fn.call(this);
            SNAPSHOTS.push(await (0, hardhat_network_helpers_1.takeSnapshot)());
            initialized = true;
        }
        else {
            const shapshot = SNAPSHOTS.pop();
            if (shapshot === undefined)
                throw Error('Missing sharedBeforeEach snapshot');
            await shapshot.restore();
            SNAPSHOTS.push(await (0, hardhat_network_helpers_1.takeSnapshot)());
        }
    });
    after(async function () {
        if (initialized) {
            SNAPSHOTS.pop();
        }
    });
}
exports.sharedBeforeEach = sharedBeforeEach;
function wrapWithTitle(title, str) {
    return title === undefined ? str : `${title} at step "${str}"`;
}
