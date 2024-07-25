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
exports.expectTransferEvent = void 0;
const expectEvent = __importStar(require("./expectEvent"));
const utils_1 = require("ethers/lib/utils");
const constants_1 = require("./constants");
function expectTransferEvent(receipt, args, token
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) {
    if (receipt.to.toLowerCase() === toAddress(token).toLowerCase()) {
        return expectEvent.inReceipt(receipt, 'Transfer', args);
    }
    return expectEvent.inIndirectReceipt(receipt, new utils_1.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']), 'Transfer', args, toAddress(token));
}
exports.expectTransferEvent = expectTransferEvent;
function toAddress(to) {
    if (!to)
        return constants_1.ZERO_ADDRESS;
    return typeof to === 'string' ? to : to.address;
}
