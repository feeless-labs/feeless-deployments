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
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
(0, _src_1.describeForkTest)('ProtocolIdRegistry', 'mainnet', 16691900, function () {
    let vault, authorizer;
    let protocolIdRegistry;
    let admin, other;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20230223-protocol-id-registry', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        protocolIdRegistry = await task.deployedInstance('ProtocolIdRegistry');
    });
    before('setup accounts', async () => {
        [, other, admin] = await hardhat_1.ethers.getSigners();
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    before('grant register and rename permissions to admin', async () => {
        const govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(protocolIdRegistry, 'registerProtocolId'), admin.address);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(protocolIdRegistry, 'renameProtocolId'), admin.address);
    });
    it('gets default protocol IDs', async () => {
        (0, chai_1.expect)(await protocolIdRegistry.isValidProtocolId(0)).to.be.true;
        (0, chai_1.expect)(await protocolIdRegistry.getProtocolName(0)).to.be.eq('Aave v1');
        (0, chai_1.expect)(await protocolIdRegistry.isValidProtocolId(18)).to.be.true;
        (0, chai_1.expect)(await protocolIdRegistry.getProtocolName(18)).to.be.eq('Agave');
        (0, chai_1.expect)(await protocolIdRegistry.isValidProtocolId(19)).to.be.false;
    });
    it('reverts when adding or renaming protocol IDs without permission', async () => {
        await (0, chai_1.expect)(protocolIdRegistry.connect(other).registerProtocolId(20, 'test')).to.be.revertedWith('BAL#401');
        await (0, chai_1.expect)(protocolIdRegistry.connect(other).renameProtocolId(1, 'test')).to.be.revertedWith('BAL#401');
    });
    it('adds new protocols', async () => {
        await protocolIdRegistry.connect(admin).registerProtocolId(20, 'new protocol');
        (0, chai_1.expect)(await protocolIdRegistry.isValidProtocolId(20)).to.be.true;
        (0, chai_1.expect)(await protocolIdRegistry.getProtocolName(20)).to.be.eq('new protocol');
    });
    it('renames existing protocols', async () => {
        await protocolIdRegistry.connect(admin).renameProtocolId(20, 'new protocol V2');
        (0, chai_1.expect)(await protocolIdRegistry.isValidProtocolId(20)).to.be.true;
        (0, chai_1.expect)(await protocolIdRegistry.getProtocolName(20)).to.be.eq('new protocol V2');
    });
});
