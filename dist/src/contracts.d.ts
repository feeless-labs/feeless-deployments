import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Artifact, Libraries, Param } from './types';
export declare function deploy(contract: Artifact | string, args?: Array<Param>, from?: SignerWithAddress, libs?: Libraries): Promise<Contract>;
export declare function instanceAt(contract: Artifact | string, address: string): Promise<Contract>;
export declare function deploymentTxData(artifact: Artifact, args?: Array<Param>, libs?: Libraries): Promise<string>;
export declare function getArtifact(contract: string): Artifact;
