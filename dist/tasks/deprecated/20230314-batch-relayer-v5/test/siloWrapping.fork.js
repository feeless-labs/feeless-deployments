"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const numbers_1 = require("@helpers/numbers");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('SiloWrapping', 'mainnet', 16622559, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const USDC_HOLDER = '0xda9ce944a37d218c3302f6b82a094844c6eceb17';
    const sUSDC = '0x416DE9AD46C53AAAb2352F91120952393946d2ac';
    const USDC_SILO = '0xfccc27aabd0ab7a0b2ad2b7760037b1eab61616b';
    let usdcToken, shareToken, silo;
    let sender, recipient;
    let chainedReference;
    const amountToWrap = 100e6;
    before('run task', async () => {
        task = new _src_1.Task('20230314-batch-relayer-v5', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
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
        shareToken = await task.instanceAt('IShareToken', sUSDC);
        silo = await task.instanceAt('ISilo', USDC_SILO);
        sender = await (0, _src_1.impersonate)(USDC_HOLDER);
        recipient = await (0, _src_1.getSigner)();
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
    });
    it('should wrap successfully', async () => {
        const balanceOfUSDCBefore = await usdcToken.balanceOf(sender.address);
        const balanceOfWrappedBefore = await shareToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfWrappedBefore).to.be.equal(0);
        // Approving vault to pull tokens from user.
        await usdcToken.connect(sender).approve(vault.address, amountToWrap);
        chainedReference = toChainedReference(30);
        const depositIntoSilo = library.interface.encodeFunctionData('wrapShareToken', [
            sUSDC,
            sender.address,
            recipient.address,
            amountToWrap,
            chainedReference,
        ]);
        await relayer.connect(sender).multicall([depositIntoSilo]);
        const balanceOfUSDCAfter = await usdcToken.balanceOf(sender.address);
        const balanceOfWrappedAfter = await shareToken.balanceOf(recipient.address);
        const estimatedRate = await siloExchangeRate(silo, USDC, shareToken);
        const expectedBalanceOfWrappedAfter = (0, numbers_1.bn)(estimatedRate).mul(amountToWrap);
        (0, chai_1.expect)(balanceOfUSDCBefore.sub(balanceOfUSDCAfter)).to.be.equal(amountToWrap);
        (0, chai_1.expect)(balanceOfWrappedAfter).to.be.almostEqual(expectedBalanceOfWrappedAfter, 0.01);
    });
    it('should unwrap successfully', async () => {
        const estimatedRate = await siloExchangeRate(silo, USDC, shareToken);
        const wrappedRate = Math.floor(1e6 / estimatedRate);
        const balanceOfWrappedBefore = await shareToken.balanceOf(recipient.address);
        const amountToWithdraw = Math.floor((wrappedRate * balanceOfWrappedBefore) / 1e6);
        const balanceOfUSDCBefore = await usdcToken.balanceOf(sender.address);
        const withdrawFromSilo = library.interface.encodeFunctionData('unwrapShareToken', [
            sUSDC,
            recipient.address,
            sender.address,
            amountToWithdraw,
            chainedReference,
        ]);
        await shareToken.connect(recipient).approve(vault.address, amountToWithdraw);
        await relayer.connect(recipient).multicall([withdrawFromSilo]);
        const balanceOfUSDCAfter = await usdcToken.balanceOf(sender.address);
        const balanceOfWrappedAfter = await shareToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfWrappedBefore.sub(balanceOfWrappedAfter)).to.be.equal(amountToWithdraw);
        // Because rate is very close to 1
        (0, chai_1.expect)(balanceOfUSDCAfter.sub(balanceOfUSDCBefore)).to.be.almostEqual(amountToWithdraw);
    });
});
function toChainedReference(key) {
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
    return ethers_1.BigNumber.from(paddedPrefix).add(key);
}
async function siloExchangeRate(silo, mainTokenAddress, wrappedTokenContract) {
    const assetSotrage = await silo.assetStorage(mainTokenAddress);
    const totalAmount = assetSotrage[3];
    const totalShares = await wrappedTokenContract.totalSupply();
    return totalAmount / totalShares;
}
