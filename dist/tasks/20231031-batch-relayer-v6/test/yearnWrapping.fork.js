"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const _src_1 = require("@src");
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('BatchRelayerLibrary V6 - YearnWrapping', 'mainnet', 16622559, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const USDC_HOLDER = '0x0a59649758aa4d66e25f08dd01271e891fe52199';
    const yvUSDC = '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE';
    let usdcToken, yearnToken;
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
        usdcToken = await task.instanceAt('IERC20', USDC);
        yearnToken = await task.instanceAt('IYearnTokenVault', yvUSDC);
        sender = await (0, _src_1.impersonate)(USDC_HOLDER);
        recipient = await (0, _src_1.getSigner)();
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
    });
    it('should wrap successfully', async () => {
        const balanceOfUSDCBefore = await usdcToken.balanceOf(sender.address);
        const balanceOfYearnBefore = await yearnToken.balanceOf(recipient.address);
        const expectedBalanceOfYearnAfter = Math.floor((1e6 / (await yearnToken.pricePerShare())) * amountToWrap);
        (0, chai_1.expect)(balanceOfYearnBefore).to.be.equal(0);
        // Approving vault to pull tokens from user.
        await usdcToken.connect(sender).approve(vault.address, amountToWrap);
        chainedReference = toChainedReference(30);
        const depositIntoYearn = library.interface.encodeFunctionData('wrapYearn', [
            yvUSDC,
            sender.address,
            recipient.address,
            amountToWrap,
            chainedReference,
        ]);
        await relayer.connect(sender).multicall([depositIntoYearn]);
        const balanceOfUSDCAfter = await usdcToken.balanceOf(sender.address);
        const balanceOfYearnAfter = await yearnToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfUSDCBefore.sub(balanceOfUSDCAfter)).to.be.equal(amountToWrap);
        (0, chai_1.expect)(balanceOfYearnAfter).to.be.almostEqual(expectedBalanceOfYearnAfter);
    });
    it('should unwrap successfully', async () => {
        const YearnAmountToWithdraw = Math.floor((1e6 / (await yearnToken.pricePerShare())) * amountToWrap);
        const balanceOfUSDCBefore = await usdcToken.balanceOf(sender.address);
        const balanceOfYearnBefore = await yearnToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfYearnBefore).to.be.almostEqual(YearnAmountToWithdraw);
        const withdrawFromYearn = library.interface.encodeFunctionData('unwrapYearn', [
            yvUSDC,
            recipient.address,
            sender.address,
            chainedReference,
            0,
        ]);
        await yearnToken.connect(recipient).approve(vault.address, constants_1.MAX_UINT256);
        await relayer.connect(recipient).multicall([withdrawFromYearn]);
        const balanceOfUSDCAfter = await usdcToken.balanceOf(sender.address);
        const balanceOfYearnAfter = await yearnToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfYearnAfter).to.be.equal(0);
        (0, chai_1.expect)(balanceOfUSDCAfter.sub(balanceOfUSDCBefore)).to.be.almostEqual(amountToWrap);
    });
});
function toChainedReference(key) {
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
    return ethers_1.BigNumber.from(paddedPrefix).add(key);
}
