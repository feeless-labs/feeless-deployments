import { Network } from './types';
export declare function describeForkTest(name: string, forkNetwork: Network, blockNumber: number, callback: () => void): void;
export declare namespace describeForkTest {
    var only: (name: string, forkNetwork: string, blockNumber: number, callback: () => void) => void;
    var skip: (name: string, forkNetwork: string, blockNumber: number, callback: () => void) => void;
}
