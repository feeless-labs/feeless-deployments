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
const _src_5 = require("@src");
(0, _src_1.describeForkTest)('L2VotingEscrowDelegationProxy', 'arbitrum', 70407500, function () {
    let vault, authorizer;
    let veProxy, nullVotingEscrow, veDelegation;
    let admin, user1, user2;
    let task;
    const GOV_MULTISIG = '0xaf23dc5983230e9eeaf93280e312e57539d098d0';
    const user1VeBal = (0, numbers_1.fp)(100);
    const user2VeBal = (0, numbers_1.fp)(200);
    before('run task', async () => {
        task = new _src_2.Task('20230316-l2-ve-delegation-proxy', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        veProxy = await task.deployedInstance('VotingEscrowDelegationProxy');
        nullVotingEscrow = await task.deployedInstance('NullVotingEscrow');
    });
    before('setup accounts', async () => {
        [, admin, user1, user2] = await hardhat_1.ethers.getSigners();
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    before('setup mock VE delegation implementation', async () => {
        veDelegation = await (0, _src_5.deploy)('MockVeDelegation');
        await veDelegation.mint(user1.address, user1VeBal);
        await veDelegation.mint(user2.address, user2VeBal);
    });
    before('grant set and kill delegation permissions to admin', async () => {
        const govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(veProxy, 'setDelegation'), admin.address);
        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(veProxy, 'killDelegation'), admin.address);
    });
    describe('getters', () => {
        it('returns null voting escrow', async () => {
            (0, chai_1.expect)(await veProxy.getVotingEscrow()).to.be.eq(nullVotingEscrow.address);
        });
        it('returns empty default voting escrow delegation implementation', async () => {
            (0, chai_1.expect)(await veProxy.getDelegationImplementation()).to.be.eq(constants_1.ZERO_ADDRESS);
        });
    });
    it('returns 0 total supply', async () => {
        (0, chai_1.expect)(await veProxy.totalSupply()).to.be.eq(0);
    });
    it('returns 0 balance for users', async () => {
        (0, chai_1.expect)(await veProxy.adjusted_balance_of(user1.address)).to.be.eq(0);
        (0, chai_1.expect)(await veProxy.adjusted_balance_of(user2.address)).to.be.eq(0);
    });
    it('sets a new delegation implementation', async () => {
        const tx = await veProxy.connect(admin).setDelegation(veDelegation.address);
        expectEvent.inReceipt(await tx.wait(), 'DelegationImplementationUpdated', {
            newImplementation: veDelegation.address,
        });
    });
    it('uses new delegation', async () => {
        (0, chai_1.expect)(await veProxy.adjusted_balance_of(user1.address)).to.be.eq(user1VeBal);
        (0, chai_1.expect)(await veProxy.adjusted_balance_of(user2.address)).to.be.eq(user2VeBal);
        (0, chai_1.expect)(await veProxy.totalSupply()).to.be.eq(user1VeBal.add(user2VeBal));
    });
    it('kills delegation', async () => {
        const tx = await veProxy.connect(admin).killDelegation();
        expectEvent.inReceipt(await tx.wait(), 'DelegationImplementationUpdated', {
            newImplementation: constants_1.ZERO_ADDRESS,
        });
    });
    it('returns 0 total supply again', async () => {
        (0, chai_1.expect)(await veProxy.totalSupply()).to.be.eq(0);
    });
    it('returns 0 balance for users again', async () => {
        (0, chai_1.expect)(await veProxy.adjusted_balance_of(user1.address)).to.be.eq(0);
        (0, chai_1.expect)(await veProxy.adjusted_balance_of(user2.address)).to.be.eq(0);
    });
});
