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
const ethers_1 = require("ethers");
const _src_1 = require("@src");
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('BatchRelayerLibrary V6 - TetuWrapping', 'polygon', 37945364, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    const USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
    const USDT_HOLDER = '0xf977814e90da44bfa03b6295a0616a897441acec';
    const xUSDT = '0xE680e0317402ad3CB37D5ed9fc642702658Ef57F';
    const TETU_GOVERNANCE = '0xcc16d636dD05b52FF1D8B9CE09B09BC62b11412B';
    const TETU_CONTROLLER = '0x6678814c273d5088114B6E40cC49C8DB04F9bC29';
    let usdtToken, tetuVault;
    let sender, recipient;
    let chainedReference;
    const amountToWrap = 100e6;
    before('run task', async () => {
        task = new _src_1.Task('20231031-batch-relayer-v6', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load vault and tokens', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', await library.getVault());
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    before('approve relayer at the authorizer', async () => {
        const relayerActionIds = await Promise.all(['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) => vault.getActionId(vault.interface.getSighash(action))));
        // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
        // such an account exists.
        const admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));
        // Grant relayer permission to call all relayer functions
        await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
    });
    before(async () => {
        usdtToken = await task.instanceAt('IERC20', USDT);
        tetuVault = await task.instanceAt('ITetuSmartVault', xUSDT);
        sender = await (0, _src_1.impersonate)(USDT_HOLDER);
        recipient = await (0, _src_1.getSigner)();
        // Set whitelist approvals for the batch relayer to interact with the Tetu Smart Vault
        const governance = await (0, _src_1.impersonate)(TETU_GOVERNANCE);
        const tetuControllerABI = new hardhat_1.ethers.utils.Interface([
            'function changeWhiteListStatus(address[] memory _targets, bool status) external',
        ]).format();
        const tetuController = await hardhat_1.ethers.getContractAt(tetuControllerABI, TETU_CONTROLLER);
        await tetuController.connect(governance).changeWhiteListStatus([relayer.address], true);
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
    });
    it('should wrap successfully', async () => {
        const balanceOfUSDTBefore = await usdtToken.balanceOf(sender.address);
        const balanceOfTetuBefore = await tetuVault.balanceOf(recipient.address);
        const expectedBalanceOfTetuAfter = Math.floor((1e6 / (await tetuVault.getPricePerFullShare())) * amountToWrap);
        (0, chai_1.expect)(balanceOfTetuBefore).to.be.equal(0);
        // Approving vault to pull tokens from user.
        await usdtToken.connect(sender).approve(vault.address, amountToWrap);
        chainedReference = toChainedReference(30);
        const depositIntoTetu = library.interface.encodeFunctionData('wrapTetu', [
            xUSDT,
            sender.address,
            recipient.address,
            amountToWrap,
            chainedReference,
        ]);
        await relayer.connect(sender).multicall([depositIntoTetu]);
        const balanceOfUSDTAfter = await usdtToken.balanceOf(sender.address);
        const balanceOfTetuAfter = await tetuVault.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfUSDTBefore.sub(balanceOfUSDTAfter)).to.be.equal(amountToWrap);
        (0, chai_1.expect)(balanceOfTetuAfter).to.be.almostEqual(expectedBalanceOfTetuAfter, 0.000001);
    });
    it('should unwrap successfully', async () => {
        const tetuBalance = await tetuVault.balanceOf(recipient.address);
        const tetuAmountToWithdraw = Math.floor((tetuBalance * (await tetuVault.getPricePerFullShare())) / 1e6);
        const balanceOfUSDTBefore = await usdtToken.balanceOf(sender.address);
        const withdrawFromTetu = library.interface.encodeFunctionData('unwrapTetu', [
            xUSDT,
            recipient.address,
            sender.address,
            chainedReference,
            0,
        ]);
        await tetuVault.connect(recipient).approve(vault.address, constants_1.MAX_UINT256);
        await relayer.connect(recipient).multicall([withdrawFromTetu]);
        const balanceOfUSDTAfter = await usdtToken.balanceOf(sender.address);
        const balanceOfTetuAfter = await tetuVault.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfTetuAfter).to.be.equal(0);
        (0, chai_1.expect)(balanceOfUSDTAfter.sub(balanceOfUSDTBefore)).to.be.almostEqual(tetuAmountToWithdraw, 0.0001);
    });
});
function toChainedReference(key) {
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
    return ethers_1.BigNumber.from(paddedPrefix).add(key);
}
