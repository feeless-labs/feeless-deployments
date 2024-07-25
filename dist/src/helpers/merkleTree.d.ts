/// <reference types="node" />
export declare class MerkleTree {
    elements: Buffer[];
    layers: any[];
    constructor(elements: string[]);
    getLayers(elements: Buffer[]): any[];
    getNextLayer(elements: Buffer[]): any;
    combinedHash(first: string, second: string): Buffer | String;
    getRoot(): any;
    getHexRoot(): string;
    getProof(el: Buffer): any;
    getHexProof(_el: any): string[];
    getPairElement(idx: number, layer: any): any;
    bufIndexOf(el: Buffer | string, arr: Buffer[]): number;
    bufDedup(elements: Buffer[]): Buffer[];
    bufArrToHexArr(arr: Buffer[]): string[];
    sortAndConcat(...args: any[]): Buffer;
}
