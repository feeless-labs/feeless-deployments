import { ContractReceipt } from 'ethers';
import { Interface } from 'ethers/lib/utils';
export declare function inReceipt(receipt: ContractReceipt, eventName: string, eventArgs?: {}): any;
/**
 * Throws error if the given receipt does not contain a set of events with specific arguments.
 * Expecting a specific amount of events from a particular address is optional.
 * @param receipt Receipt to analyze.
 * @param emitter Interface of the contract emitting the event(s).
 * @param eventName Name of the event(s).
 * @param eventArgs Arguments of the event(s). This does not need to be a complete list; as long as the event contains
 *  the specified ones, the function will not throw.
 * @param address Contract address that emits the event(s). If undefined, the logs will not be filtered by address.
 * @param amount Number of expected events that match all the specified conditions. If not specified, at least one is
 *  expected.
 * @returns First matching event if the amount is not specified; all matching events otherwise.
 */
export declare function inIndirectReceipt(receipt: ContractReceipt, emitter: Interface, eventName: string, eventArgs?: {}, address?: string, amount?: number): any;
export declare function notEmitted(receipt: ContractReceipt, eventName: string): void;
