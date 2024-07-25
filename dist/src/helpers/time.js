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
exports.timestampToString = exports.MONTH = exports.WEEK = exports.DAY = exports.HOUR = exports.MINUTE = exports.SECOND = exports.receiptTimestamp = exports.lastBlockNumber = exports.setNextBlockTimestamp = exports.advanceToTimestamp = exports.advanceTime = exports.fromNow = exports.currentWeekTimestamp = exports.currentTimestamp = void 0;
const numbers_1 = require("./numbers");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const currentTimestamp = async () => {
    return (0, numbers_1.bn)(await hardhat_network_helpers_1.time.latest());
};
exports.currentTimestamp = currentTimestamp;
const currentWeekTimestamp = async () => {
    return (await (0, exports.currentTimestamp)()).div(exports.WEEK).mul(exports.WEEK);
};
exports.currentWeekTimestamp = currentWeekTimestamp;
const fromNow = async (seconds) => {
    const now = await (0, exports.currentTimestamp)();
    return now.add(seconds);
};
exports.fromNow = fromNow;
const advanceTime = async (seconds) => {
    await hardhat_network_helpers_1.time.increase(seconds);
};
exports.advanceTime = advanceTime;
const advanceToTimestamp = async (timestamp) => {
    await hardhat_network_helpers_1.time.increaseTo(timestamp);
};
exports.advanceToTimestamp = advanceToTimestamp;
const setNextBlockTimestamp = async (timestamp) => {
    await hardhat_network_helpers_1.time.setNextBlockTimestamp(timestamp);
};
exports.setNextBlockTimestamp = setNextBlockTimestamp;
const lastBlockNumber = async () => await hardhat_network_helpers_1.time.latestBlock();
exports.lastBlockNumber = lastBlockNumber;
const receiptTimestamp = async (receipt) => {
    const { ethers } = await Promise.resolve().then(() => __importStar(require('hardhat')));
    const blockHash = (await receipt).blockHash;
    const block = await ethers.provider.getBlock(blockHash);
    return block.timestamp;
};
exports.receiptTimestamp = receiptTimestamp;
exports.SECOND = 1;
exports.MINUTE = exports.SECOND * 60;
exports.HOUR = exports.MINUTE * 60;
exports.DAY = exports.HOUR * 24;
exports.WEEK = exports.DAY * 7;
exports.MONTH = exports.DAY * 30;
const timestampToString = (timestamp) => {
    if (timestamp >= exports.SECOND && timestamp < exports.MINUTE) {
        return `${timestamp} ${timestamp > exports.SECOND ? 'seconds' : 'second'}`;
    }
    else if (timestamp >= exports.MINUTE && timestamp < exports.HOUR) {
        return `${timestamp / exports.MINUTE} ${timestamp > exports.MINUTE ? 'minutes' : 'minute'}`;
    }
    else if (timestamp >= exports.HOUR && timestamp < exports.DAY) {
        return `${timestamp / exports.HOUR} ${timestamp > exports.HOUR ? 'hours' : 'hour'}`;
    }
    else if (timestamp >= exports.DAY && timestamp < exports.MONTH) {
        return `${timestamp / exports.DAY} ${timestamp > exports.DAY ? 'days' : 'day'}`;
    }
    else {
        return `${timestamp / exports.MONTH} ${timestamp > exports.MONTH ? 'months' : 'month'}`;
    }
};
exports.timestampToString = timestampToString;
