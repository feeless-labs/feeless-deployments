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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
(0, _src_1.describeForkTest)('SmartWalletCheckerCoordinator', 'mainnet', 14850000, function () {
    let govMultisig, other;
    let coordinator;
    let vault, authorizer, veBAL, smartWalletChecker;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20220421-smart-wallet-checker-coordinator', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.instanceAt('SmartWalletCheckerCoordinator', task.output({ network: 'test' }).SmartWalletCheckerCoordinator);
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', vaultTask.output({ network: 'mainnet' }).Vault);
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const veBALTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        veBAL = await veBALTask.instanceAt('VotingEscrow', veBALTask.output({ network: 'mainnet' }).VotingEscrow);
        const SmartWalletCheckerTask = new _src_2.Task('20220420-smart-wallet-checker', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        smartWalletChecker = await SmartWalletCheckerTask.instanceAt('SmartWalletChecker', SmartWalletCheckerTask.output({ network: 'mainnet' }).SmartWalletChecker);
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG);
        other = await (0, _src_4.getSigner)(1);
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await vaultTask.instanceAt('Authorizer', await coordinator.getAuthorizer());
        await authorizer
            .connect(govMultisig)
            .grantRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address);
    });
    it('perform first stage', async () => {
        await coordinator.performFirstStage();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(1);
    });
    it('sets the smart wallet checker in veBAL', async () => {
        (0, chai_1.expect)(await veBAL.smart_wallet_checker()).to.equal(smartWalletChecker.address);
    });
    it('authorizes the multisig to add contracts to the smart wallet checker', async () => {
        const tx = await smartWalletChecker.connect(govMultisig).allowlistAddress(other.address);
        expectEvent.inReceipt(await tx.wait(), 'ContractAddressAdded', { contractAddress: other.address });
        (0, chai_1.expect)(await smartWalletChecker.check(other.address)).to.equal(true);
    });
    it('authorizes the multisig to remove contracts from the smart wallet checker', async () => {
        const tx = await smartWalletChecker.connect(govMultisig).denylistAddress(other.address);
        expectEvent.inReceipt(await tx.wait(), 'ContractAddressRemoved', { contractAddress: other.address });
        (0, chai_1.expect)(await smartWalletChecker.check(other.address)).to.equal(false);
    });
    it('renounces the admin role', async () => {
        (0, chai_1.expect)(await authorizer.hasRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address)).to.equal(false);
    });
});
