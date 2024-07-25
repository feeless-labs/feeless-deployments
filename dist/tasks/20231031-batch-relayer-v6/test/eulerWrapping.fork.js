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
(0, _src_1.describeForkTest)('BatchRelayerLibrary V6 - EulerWrapping', 'mainnet', 16636628, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const USDC_HOLDER = '0x0a59649758aa4d66e25f08dd01271e891fe52199';
    const eUSDC = '0xEb91861f8A4e1C12333F42DCE8fB0Ecdc28dA716'; //proxy
    const EULER_PROTOCOL = '0x27182842E098f60e3D576794A5bFFb0777E025d3';
    let usdcToken, eToken;
    let sender, recipient;
    let chainedReference;
    let chainedReferenceOut;
    const amountToWrap = 50000e6; //50k USDC
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
        eToken = await task.instanceAt('IEulerToken', eUSDC);
        sender = await (0, _src_1.impersonate)(USDC_HOLDER);
        recipient = await (0, _src_1.getSigner)();
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
    });
    it('should wrap successfully', async () => {
        const balanceOfUSDCBefore = await usdcToken.balanceOf(sender.address);
        const balanceOfeUSDClBefore = await eToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfeUSDClBefore).to.be.equal(0);
        // Approving vault to pull tokens from user.
        await usdcToken.connect(sender).approve(vault.address, amountToWrap);
        chainedReference = toChainedReference(30);
        const depositIntoEuler = library.interface.encodeFunctionData('wrapEuler', [
            eUSDC,
            EULER_PROTOCOL,
            sender.address,
            recipient.address,
            amountToWrap,
            chainedReference,
        ]);
        await relayer.connect(sender).multicall([depositIntoEuler]);
        const balanceOfUSDCAfter = await usdcToken.balanceOf(sender.address);
        const balanceOfeUSDCAfter = await eToken.balanceOf(recipient.address);
        // @param underlyingAmount Amount in underlying units (same decimals as underlying token)
        // @return eToken balance, in internal book-keeping units (18 decimals)
        const expectedbalanceOfeUSDCAfter = await eToken.convertUnderlyingToBalance(amountToWrap);
        (0, chai_1.expect)(balanceOfUSDCBefore.sub(balanceOfUSDCAfter)).to.be.equal(amountToWrap);
        (0, chai_1.expect)(balanceOfeUSDCAfter).to.be.equal(expectedbalanceOfeUSDCAfter);
    });
    it('should unwrap successfully', async () => {
        // in underlying decimals
        const eAmountToWithdraw = await eToken.convertUnderlyingToBalance(amountToWrap);
        const balanceOfUSDCBefore = await usdcToken.balanceOf(sender.address);
        const balanceOfeUSDCBefore = await eToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfeUSDCBefore).to.be.equal(eAmountToWithdraw);
        const withdrawFromEuler = library.interface.encodeFunctionData('unwrapEuler', [
            eUSDC,
            recipient.address,
            sender.address,
            chainedReference,
            0,
        ]);
        await eToken.connect(recipient).approve(vault.address, constants_1.MAX_UINT256);
        await relayer.connect(recipient).multicall([withdrawFromEuler]);
        const balanceOfUSDCAfter = await usdcToken.balanceOf(sender.address);
        const balanceOfeUSDCAfter = await eToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfeUSDCAfter).to.be.equal(0);
        (0, chai_1.expect)(balanceOfUSDCAfter.sub(balanceOfUSDCBefore)).to.be.almostEqual(amountToWrap, 0.01);
    });
    it('should wrap and unwrap successfully', async () => {
        chainedReference = toChainedReference(30);
        chainedReferenceOut = toChainedReference(80);
        await usdcToken.connect(sender).approve(vault.address, amountToWrap * 2);
        await eToken.connect(sender).approve(vault.address, constants_1.MAX_UINT256);
        const depositIntoEuler_1 = library.interface.encodeFunctionData('wrapEuler', [
            eUSDC,
            EULER_PROTOCOL,
            sender.address,
            sender.address,
            amountToWrap,
            chainedReference,
        ]);
        const withdrawFromEuler = library.interface.encodeFunctionData('unwrapEuler', [
            eUSDC,
            sender.address,
            sender.address,
            chainedReference,
            chainedReferenceOut,
        ]);
        const depositIntoEuler_2 = library.interface.encodeFunctionData('wrapEuler', [
            eUSDC,
            EULER_PROTOCOL,
            sender.address,
            recipient.address,
            chainedReferenceOut,
            0,
        ]);
        await relayer.connect(sender).multicall([depositIntoEuler_1, withdrawFromEuler, depositIntoEuler_2]);
    });
});
function toChainedReference(key) {
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
    return ethers_1.BigNumber.from(paddedPrefix).add(key);
}
