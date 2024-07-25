"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBalance = exports.impersonate = exports.getSigner = exports.getSigners = void 0;
const signer_with_address_1 = require("@nomiclabs/hardhat-ethers/dist/src/signer-with-address");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const numbers_1 = require("./helpers/numbers");
async function getSigners() {
    const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
    return ethers.getSigners();
}
exports.getSigners = getSigners;
async function getSigner(index = 0) {
    return (await getSigners())[index];
}
exports.getSigner = getSigner;
async function impersonate(address, balance = (0, numbers_1.fp)(100)) {
    await (0, hardhat_network_helpers_1.impersonateAccount)(address);
    await setBalance(address, balance);
    const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
    const signer = ethers.provider.getSigner(address);
    return signer_with_address_1.SignerWithAddress.create(signer);
}
exports.impersonate = impersonate;
async function setBalance(address, balance) {
    await (0, hardhat_network_helpers_1.setBalance)(address, balance);
}
exports.setBalance = setBalance;
