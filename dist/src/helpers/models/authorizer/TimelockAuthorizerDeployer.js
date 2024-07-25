"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const time_1 = require("@helpers/time");
const _src_1 = require("@src");
const TimelockAuthorizer_1 = __importDefault(require("./TimelockAuthorizer"));
const constants_1 = require("@helpers/constants");
exports.default = {
    async deploy(deployment) {
        const root = deployment.root || deployment.from || (await hardhat_1.ethers.getSigners())[0];
        const nextRoot = deployment.nextRoot || constants_1.ZERO_ADDRESS;
        const rootTransferDelay = deployment.rootTransferDelay || time_1.MONTH;
        const entrypoint = await (0, _src_1.deploy)('MockAuthorizerAdaptorEntrypoint');
        const args = [toAddress(root), toAddress(nextRoot), entrypoint.address, rootTransferDelay];
        const instance = await (0, _src_1.deploy)('TimelockAuthorizer', args);
        return new TimelockAuthorizer_1.default(instance, root);
    },
};
function toAddress(to) {
    if (!to)
        return constants_1.ZERO_ADDRESS;
    return typeof to === 'string' ? to : to.address;
}
