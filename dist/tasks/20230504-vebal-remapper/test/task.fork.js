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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const actions_1 = require("@helpers/models/misc/actions");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const _src_5 = require("@src");
(0, _src_1.describeForkTest)('VotingEscrowRemapper', 'mainnet', 17182400, function () {
    let vault, authorizer;
    let veRemapper, veBAL, smartWalletChecker, omniVotingEscrow;
    let omniVotingEscrowAdaptor;
    let admin, other, manager;
    let local, disallowedAccount;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const VEBAL_HOLDER = '0xd519D5704B41511951C8CF9f65Fee9AB9beF2611';
    const chainId = 42161;
    const remoteAccount = (0, constants_1.randomAddress)();
    const otherRemoteAccount = (0, constants_1.randomAddress)();
    before('run task', async () => {
        task = new _src_2.Task('20230504-vebal-remapper', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        veRemapper = await task.deployedInstance('VotingEscrowRemapper');
        omniVotingEscrowAdaptor = await task.deployedInstance('OmniVotingEscrowAdaptor');
    });
    before('setup accounts', async () => {
        [, other, disallowedAccount, admin, manager] = await hardhat_1.ethers.getSigners();
        local = await (0, _src_4.impersonate)(VEBAL_HOLDER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        veBAL = await gaugeControllerTask.deployedInstance('VotingEscrow');
        const smartWalletCheckerTask = new _src_2.Task('20220420-smart-wallet-checker', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        smartWalletChecker = await smartWalletCheckerTask.deployedInstance('SmartWalletChecker');
        omniVotingEscrow = await (0, _src_5.deploy)('MockOmniVotingEscrow');
    });
    before('grant register and rename permissions to admin', async () => {
        const govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(veRemapper, 'setNetworkRemappingManager'), admin.address);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(omniVotingEscrowAdaptor, 'setOmniVotingEscrow'), admin.address);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(smartWalletChecker, 'allowlistAddress'), admin.address);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(smartWalletChecker, 'denylistAddress'), admin.address);
    });
    before('allowlist L1 account to be remapped in smart wallet checker', async () => {
        await smartWalletChecker.connect(admin).allowlistAddress(local.address);
    });
    before('set omni voting escrow', async () => {
        await omniVotingEscrowAdaptor.connect(admin).setOmniVotingEscrow(omniVotingEscrow.address);
    });
    it('gets total supply', async () => {
        (0, chai_1.expect)(await veRemapper.getTotalSupplyPoint()).to.be.deep.eq(await veBAL.point_history(await veBAL.epoch()));
    });
    it('gets locked end for user', async () => {
        (0, chai_1.expect)(await veRemapper.getLockedEnd(local.address)).to.be.eq(await veBAL.locked__end(local.address));
    });
    it('remaps allowed account', async () => {
        const tx = await veRemapper.connect(local).setNetworkRemapping(local.address, remoteAccount, chainId);
        expectEvent.inReceipt(await tx.wait(), 'AddressMappingUpdated', {
            localUser: local.address,
            remoteUser: remoteAccount,
            chainId,
        });
        (0, chai_1.expect)(await veRemapper.getRemoteUser(local.address, chainId)).to.be.eq(remoteAccount);
        (0, chai_1.expect)(await veRemapper.getLocalUser(remoteAccount, chainId)).to.be.eq(local.address);
    });
    it('remaps using an appointed remapper', async () => {
        await veRemapper.connect(admin).setNetworkRemappingManager(local.address, manager.address);
        const tx = await veRemapper.connect(manager).setNetworkRemapping(local.address, otherRemoteAccount, chainId);
        expectEvent.inReceipt(await tx.wait(), 'AddressMappingUpdated', {
            localUser: local.address,
            remoteUser: otherRemoteAccount,
            chainId,
        });
        (0, chai_1.expect)(await veRemapper.getRemoteUser(local.address, chainId)).to.be.eq(otherRemoteAccount);
        (0, chai_1.expect)(await veRemapper.getLocalUser(otherRemoteAccount, chainId)).to.be.eq(local.address);
        // Cleans previous entry.
        (0, chai_1.expect)(await veRemapper.getLocalUser(remoteAccount, chainId)).to.be.eq(constants_1.ZERO_ADDRESS);
    });
    it('reverts clearing the mapping of an allowed account', async () => {
        await (0, chai_1.expect)(veRemapper.clearNetworkRemapping(local.address, chainId)).to.be.revertedWith('localUser is still in good standing');
    });
    it('clears remapping of deny-listed account', async () => {
        await smartWalletChecker.connect(admin).denylistAddress(local.address);
        const receipt = await (await veRemapper.clearNetworkRemapping(local.address, chainId)).wait();
        expectEvent.inReceipt(receipt, 'AddressMappingUpdated', {
            localUser: local.address,
            remoteUser: constants_1.ZERO_ADDRESS,
            chainId,
        });
        expectEvent.inReceipt(receipt, 'RemoteAddressMappingCleared', { remoteUser: otherRemoteAccount, chainId });
    });
    it('reverts with disallowed account', async () => {
        await (0, chai_1.expect)(veRemapper.connect(disallowedAccount).setNetworkRemapping(disallowedAccount.address, other.address, chainId)).to.be.revertedWith('Only contracts which can hold veBAL can set up a mapping');
    });
});
