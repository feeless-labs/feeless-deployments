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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
const constants_1 = require("@helpers/constants");
const expectEvent = __importStar(require("@helpers/expectEvent"));
(0, _src_1.describeForkTest)('TribeBALMinterCoordinator', 'mainnet', 14850000, function () {
    let govMultisig;
    let coordinator;
    let authorizer;
    let balToken;
    let mintRole;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const BAL = '0xba100000625a3754423978a60c9317c58a424e3D';
    const TRIBE_BAL_RECIPIENT = '0xc5bb8F0253776beC6FF450c2B40f092f7e7f5b57';
    const TRIBE_BAL_MINT_AMOUNT = '34343783425791862574551';
    before('run task', async () => {
        task = new _src_2.Task('20220606-tribe-bal-minter-coordinator', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.deployedInstance('TribeBALMinterCoordinator');
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        // We reuse this task as it contains an ABI similar to the one in real ERC20 tokens
        const testBALTokenTask = new _src_2.Task('20220325-test-balancer-token', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        balToken = await testBALTokenTask.instanceAt('TestBalancerToken', BAL);
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG);
        const balancerTokenAdminTask = new _src_2.Task('20220325-balancer-token-admin', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const balancerTokenAdmin = await balancerTokenAdminTask.deployedInstance('BalancerTokenAdmin');
        // Gov approval for relayer
        mintRole = await (0, actions_1.actionId)(balancerTokenAdmin, 'mint');
        await authorizer.connect(govMultisig).grantRoles([mintRole], coordinator.address);
    });
    it('mints BAL', async () => {
        const tx = await coordinator.performNextStage();
        expectEvent.inIndirectReceipt(await tx.wait(), balToken.interface, 'Transfer', { from: constants_1.ZERO_ADDRESS, to: TRIBE_BAL_RECIPIENT, value: TRIBE_BAL_MINT_AMOUNT }, balToken.address);
    });
    it('renounces its permission to mint BAL', async () => {
        (0, chai_1.expect)(await authorizer.hasRole(mintRole, coordinator.address)).to.be.false;
    });
    it('fails on future attempts to mint BAL', async () => {
        await (0, chai_1.expect)(coordinator.performNextStage()).to.be.revertedWith('All stages completed');
    });
});
