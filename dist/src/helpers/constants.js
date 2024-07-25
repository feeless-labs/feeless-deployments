"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomAddress = exports.DELEGATE_OWNER = exports.MAX_WEIGHTED_TOKENS = exports.MAX_GAS_LIMIT = exports.ONES_BYTES32 = exports.ZERO_BYTES32 = exports.ZERO_ADDRESS = exports.ANY_ADDRESS = exports.MAX_INT256 = exports.MIN_INT256 = exports.MAX_INT53 = exports.MIN_INT53 = exports.MAX_INT22 = exports.MIN_INT22 = exports.MAX_UINT64 = exports.MAX_UINT32 = exports.MAX_UINT31 = exports.MAX_UINT10 = exports.MAX_UINT96 = exports.MAX_UINT112 = exports.MAX_UINT256 = void 0;
const ethers_1 = require("ethers");
const numbers_1 = require("./numbers");
exports.MAX_UINT256 = (0, numbers_1.maxUint)(256);
exports.MAX_UINT112 = (0, numbers_1.maxUint)(112);
exports.MAX_UINT96 = (0, numbers_1.maxUint)(96);
exports.MAX_UINT10 = (0, numbers_1.maxUint)(10);
exports.MAX_UINT31 = (0, numbers_1.maxUint)(31);
exports.MAX_UINT32 = (0, numbers_1.maxUint)(32);
exports.MAX_UINT64 = (0, numbers_1.maxUint)(64);
exports.MIN_INT22 = (0, numbers_1.minInt)(22);
exports.MAX_INT22 = (0, numbers_1.maxInt)(22);
exports.MIN_INT53 = (0, numbers_1.minInt)(53);
exports.MAX_INT53 = (0, numbers_1.maxInt)(53);
exports.MIN_INT256 = (0, numbers_1.minInt)(256);
exports.MAX_INT256 = (0, numbers_1.maxInt)(256);
exports.ANY_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF';
exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
exports.ONES_BYTES32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
exports.MAX_GAS_LIMIT = 8e6;
exports.MAX_WEIGHTED_TOKENS = 100;
exports.DELEGATE_OWNER = '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B';
// This is not quite a constant, but it fits here given we also have ZERO_ADDRESS, etc.
function randomAddress() {
    return ethers_1.ethers.Wallet.createRandom().address;
}
exports.randomAddress = randomAddress;
