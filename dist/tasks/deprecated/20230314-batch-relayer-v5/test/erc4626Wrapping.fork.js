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
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('ERC4626Wrapping', 'mainnet', 18412883, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    let authorizerWithAdaptorValidation;
    const USDM = '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C';
    const USDM_HOLDER = '0xeF9A3cE48678D7e42296166865736899C3638B0E';
    const wUSDM = '0x57F5E098CaD7A3D1Eed53991D4d66C45C9AF7812';
    let usdmToken, wusdmToken;
    let sender, recipient;
    let chainedReference;
    const amountToWrap = (0, numbers_1.bn)(1e18);
    before('run task', async () => {
        task = new _src_1.Task('20230314-batch-relayer-v5', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load vault and tokens', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        const authorizerAdaptorTask = new _src_1.Task('20230414-authorizer-wrapper', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', await library.getVault());
        authorizerWithAdaptorValidation = await authorizerAdaptorTask.instanceAt('AuthorizerWithAdaptorValidation', await vault.getAuthorizer());
        authorizer = await vaultTask.instanceAt('Authorizer', await authorizerWithAdaptorValidation.getActualAuthorizer());
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
        usdmToken = await task.instanceAt('IERC20', USDM);
        wusdmToken = await task.instanceAt('IERC4626', wUSDM);
        sender = await (0, _src_1.impersonate)(USDM_HOLDER);
        recipient = await (0, _src_1.getSigner)();
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
    });
    it('should wrap successfully', async () => {
        const balanceOfUSDMBefore = await usdmToken.balanceOf(sender.address);
        const balanceOfwUSDMBefore = await wusdmToken.balanceOf(recipient.address);
        const expectedBalanceOfwUSDMAfter = await wusdmToken.convertToShares(amountToWrap);
        (0, chai_1.expect)(balanceOfwUSDMBefore).to.be.equal(0);
        // Approving vault to pull tokens from user.
        await usdmToken.connect(sender).approve(vault.address, amountToWrap);
        chainedReference = toChainedReference(30);
        const depositIntoUSDM = library.interface.encodeFunctionData('wrapERC4626', [
            wUSDM,
            sender.address,
            recipient.address,
            amountToWrap,
            chainedReference,
        ]);
        await relayer.connect(sender).multicall([depositIntoUSDM]);
        const balanceOfUSDMAfter = await usdmToken.balanceOf(sender.address);
        const balanceOfwUSDMAfter = await wusdmToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfUSDMBefore.sub(balanceOfUSDMAfter)).to.be.almostEqual(amountToWrap);
        (0, chai_1.expect)(balanceOfwUSDMAfter).to.be.almostEqual(expectedBalanceOfwUSDMAfter, 0.01);
    });
    it('should unwrap successfully', async () => {
        const YearnAmountToWithdraw = await wusdmToken.convertToShares(amountToWrap);
        const balanceOfUSDCBefore = await usdmToken.balanceOf(sender.address);
        const balanceOfYearnBefore = await wusdmToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfYearnBefore).to.be.almostEqual(YearnAmountToWithdraw);
        const withdrawFromYearn = library.interface.encodeFunctionData('unwrapERC4626', [
            wUSDM,
            recipient.address,
            sender.address,
            chainedReference,
            0,
        ]);
        await wusdmToken.connect(recipient).approve(vault.address, constants_1.MAX_UINT256);
        await relayer.connect(recipient).multicall([withdrawFromYearn]);
        const balanceOfUSDCAfter = await usdmToken.balanceOf(sender.address);
        const balanceOfYearnAfter = await wusdmToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfYearnAfter).to.be.equal(0);
        (0, chai_1.expect)(balanceOfUSDCAfter.sub(balanceOfUSDCBefore)).to.be.almostEqual(amountToWrap, 0.01);
    });
});
function toChainedReference(key) {
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
    return ethers_1.BigNumber.from(paddedPrefix).add(key);
}
