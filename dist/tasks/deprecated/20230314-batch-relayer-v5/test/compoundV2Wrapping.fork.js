"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('CompoundV2Wrapping', 'polygon', 40305420, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    const BRZ = '0x491a4eB4f1FC3BfF8E1d2FC856a6A46663aD556f';
    const BRZ_HOLDER = '0xB90B2050C955cd899b9BC8B5C743c25770EBc8AA';
    const cBRZ = '0x2e4659b451C3ba2E72D79aAf267cFc09BCCc9d7c';
    let brzToken, cToken;
    let sender, recipient;
    let chainedReference;
    const amountToWrap = (0, numbers_1.bn)(1000e4); // BRZ is 4 decimals
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
        brzToken = await task.instanceAt('IERC20', BRZ);
        cToken = await task.instanceAt('IERC20', cBRZ);
        sender = await (0, _src_1.impersonate)(BRZ_HOLDER);
        recipient = await (0, _src_1.getSigner)();
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
    });
    it('should wrap successfully', async () => {
        const balanceOfbrzBefore = await brzToken.balanceOf(sender.address);
        const balanceOfcbrzBefore = await cToken.balanceOf(sender.address);
        (0, chai_1.expect)(balanceOfcbrzBefore).to.be.equal(0);
        // Approving vault to pull tokens from user.
        await brzToken.connect(sender).approve(vault.address, amountToWrap);
        // Wrap `amountToWrap` BRZ tokens: pull from `sender`, deposit, mint cTokens and transfer to `recipient`.
        // Store the amount in an output reference.
        chainedReference = toChainedReference(80);
        const depositIntoMidas = library.interface.encodeFunctionData('wrapCompoundV2', [
            cBRZ,
            sender.address,
            recipient.address,
            amountToWrap,
            chainedReference,
        ]);
        await relayer.connect(sender).multicall([depositIntoMidas]);
        const balanceOfbrzAfter = await brzToken.balanceOf(sender.address);
        (0, chai_1.expect)(balanceOfbrzBefore.sub(balanceOfbrzAfter)).to.be.equal(amountToWrap);
        const balanceOfcbrzAfter = await cToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfcbrzAfter).to.be.gt(0);
    });
    it('should unwrap successfully', async () => {
        const balanceOfbrzBefore = await brzToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfbrzBefore).to.be.equal(0);
        // Recipient has cTokens. Unwrap by reading amount from the chained reference,
        // Pull the cTokens from recipient (sender), burn them, withdraw underlying tokens,
        // and transfer to recipient.
        const withdrawFromMidas = library.interface.encodeFunctionData('unwrapCompoundV2', [
            cBRZ,
            recipient.address,
            recipient.address,
            chainedReference,
            0,
        ]);
        await cToken.connect(recipient).approve(vault.address, constants_1.MAX_UINT256);
        await relayer.connect(recipient).multicall([withdrawFromMidas]);
        const balanceOfbrzAfter = await brzToken.balanceOf(recipient.address);
        const balanceOfcbrzbAfter = await cToken.balanceOf(recipient.address);
        (0, chai_1.expect)(balanceOfcbrzbAfter).to.be.equal(0);
        (0, chai_1.expect)(balanceOfbrzAfter).to.be.almostEqual(amountToWrap, 0.01);
    });
});
function toChainedReference(key) {
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
    return ethers_1.BigNumber.from(paddedPrefix).add(key);
}
