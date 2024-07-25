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
const hardhat_1 = __importStar(require("hardhat"));
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const actions_1 = require("@helpers/models/misc/actions");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('L2Layer0BridgeForwarder', 'arbitrum', 70407500, function () {
    let vault, authorizer;
    let forwarder;
    let admin, other;
    let delegation;
    let task;
    const GOV_MULTISIG = '0xaf23dc5983230e9eeaf93280e312e57539d098d0';
    before('run task', async () => {
        task = new _src_2.Task('20230404-l2-layer0-bridge-forwarder', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        forwarder = await task.deployedInstance('L2LayerZeroBridgeForwarder');
    });
    before('setup accounts', async () => {
        [, admin, other] = await hardhat_1.ethers.getSigners();
        delegation = (0, constants_1.randomAddress)();
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    before('grant set and kill delegation permissions to admin', async () => {
        const govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(forwarder, 'setDelegation'), admin.address);
    });
    it('returns empty delegation', async () => {
        (0, chai_1.expect)(await forwarder.getDelegationImplementation()).to.be.eq(constants_1.ZERO_ADDRESS);
    });
    it('reverts if non-admin sets a new delegation', async () => {
        // SENDER_NOT_ALLOWED
        await (0, chai_1.expect)(forwarder.connect(other).setDelegation(delegation)).to.be.revertedWith('BAL#401');
    });
    it('sets a new delegation', async () => {
        const tx = await forwarder.connect(admin).setDelegation(delegation);
        expectEvent.inReceipt(await tx.wait(), 'DelegationImplementationUpdated', {
            newImplementation: delegation,
        });
        (0, chai_1.expect)(await forwarder.getDelegationImplementation()).to.be.eq(delegation);
    });
});
