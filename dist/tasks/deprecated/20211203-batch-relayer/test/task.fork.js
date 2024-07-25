"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const signatures_1 = require("@helpers/models/misc/signatures");
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const types_1 = require("@helpers/models/types/types");
const time_1 = require("@helpers/time");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('BatchRelayerLibrary', 'mainnet', 14850000, function () {
    let task;
    let relayer, library;
    let sender, admin;
    let vault, authorizer, dai, usdc;
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    const DAI_USDC_USDT_POOL = '0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000063';
    const ETH_DAI_POOL = '0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a';
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    function toChainedReference(key) {
        // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
        const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
        return ethers_1.BigNumber.from(paddedPrefix).add(key);
    }
    before('run task', async () => {
        task = new _src_1.Task('20211203-batch-relayer', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load vault and tokens', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', await library.getVault());
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        dai = await task.instanceAt('IERC20', DAI);
        usdc = await task.instanceAt('IERC20', USDC);
    });
    before('load signers', async () => {
        // We impersonate a whale that holds large token amounts, but can't use it directly as impersonation doesn't let us
        // sign messages. Therefore, we transfer its tokens to our sender.
        const whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
        // The sender begins with just USDC and ETH
        sender = await (0, _src_1.getSigner)();
        await usdc.connect(whale).transfer(sender.address, await usdc.balanceOf(whale.address));
        // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
        // such an account exists.
        admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));
    });
    before('approve tokens by sender', async () => {
        // Even though the sender only starts with USDC, they will eventually get DAI and need to use it in the Vault
        await Promise.all([usdc, dai].map(async (token) => await token.connect(sender).approve(vault.address, constants_1.MAX_UINT256)));
    });
    before('approve relayer at the authorizer', async () => {
        const relayerActionIds = await Promise.all(['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) => vault.getActionId(vault.interface.getSighash(action))));
        // Grant relayer permission to call all relayer functions
        await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
    });
    afterEach('disapprove relayer by sender', async () => {
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, false);
    });
    async function getApprovalCalldata(deadline) {
        return library.interface.encodeFunctionData('setRelayerApproval', [
            relayer.address,
            true,
            signatures_1.RelayerAuthorization.encodeCalldataAuthorization('0x', deadline, await signatures_1.RelayerAuthorization.signSetRelayerApprovalAuthorization(vault, sender, relayer, vault.interface.encodeFunctionData('setRelayerApproval', [sender.address, relayer.address, true]), deadline)),
        ]);
    }
    it('sender can approve relayer, swap and join', async () => {
        const deadline = await (0, time_1.fromNow)(30 * time_1.MINUTE);
        // Swap USDC for DAI
        const swapCalldata = library.interface.encodeFunctionData('swap', [
            {
                poolId: DAI_USDC_USDT_POOL,
                kind: types_1.SwapKind.GivenIn,
                assetIn: USDC,
                assetOut: DAI,
                amount: await usdc.balanceOf(sender.address),
                userData: '0x',
            },
            {
                sender: sender.address,
                recipient: sender.address,
                fromInternalBalance: false,
                toInternalBalance: false,
            },
            0,
            deadline,
            0,
            toChainedReference(42),
        ]);
        // Use all DAI to join the ETH-DAI pool
        const { tokens: poolTokens } = await vault.getPoolTokens(ETH_DAI_POOL);
        const amountsIn = poolTokens.map((poolToken) => poolToken.toLowerCase() == DAI.toLowerCase() ? toChainedReference(42) : 0);
        const joinCalldata = library.interface.encodeFunctionData('joinPool', [
            ETH_DAI_POOL,
            0,
            sender.address,
            sender.address,
            {
                assets: poolTokens,
                maxAmountsIn: amountsIn,
                userData: encoder_1.WeightedPoolEncoder.joinExactTokensInForBPTOut(amountsIn, 0),
                fromInternalBalance: false,
            },
            0,
            0, // No output reference
        ]);
        await relayer.connect(sender).multicall([getApprovalCalldata(deadline), swapCalldata, joinCalldata]);
        const pool = await task.instanceAt('IERC20', ETH_DAI_POOL.slice(0, 42));
        (0, chai_1.expect)(await pool.balanceOf(sender.address)).to.be.gt(0);
    });
});
