"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const constants_1 = require("@helpers/constants");
const abi_coder_1 = require("@ethersproject/abi/lib/abi-coder");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('BatchRelayerLibrary', 'mainnet', 15485000, function () {
    let task;
    let relayer, library;
    let sender;
    let vault, authorizer;
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const ETH_STETH_POOL = '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080';
    const ETH_STETH_GAUGE = '0xcD4722B7c24C29e0413BDCd9e51404B4539D14aE';
    const ETH_DAI_POOL = '0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a';
    const ETH_DAI_GAUGE = '0x4ca6AC0509E6381Ca7CD872a6cdC0Fbf00600Fa1';
    const STAKED_ETH_STETH_HOLDER = '0x4B581dedA2f2C0650C3dFC506C86a8C140d9f699';
    const CHAINED_REFERENCE_PREFIX = 'ba10';
    function toChainedReference(key) {
        // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
        const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
        return ethers_1.BigNumber.from(paddedPrefix).add(key);
    }
    before('run task', async () => {
        task = new _src_1.Task('20220916-batch-relayer-v4', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load vault and tokens', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', await library.getVault());
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    before('load signers', async () => {
        // We impersonate an account that holds staked BPT for the ETH_STETH Pool.
        sender = await (0, _src_1.impersonate)(STAKED_ETH_STETH_HOLDER);
    });
    before('approve relayer at the authorizer', async () => {
        const relayerActionIds = await Promise.all(['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) => vault.getActionId(vault.interface.getSighash(action))));
        // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
        // such an account exists.
        const admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));
        // Grant relayer permission to call all relayer functions
        await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
    });
    before('approve relayer by the user', async () => {
        await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
    });
    it('sender can unstake, exit, join and stake', async () => {
        const destinationGauge = await task.instanceAt('IERC20', ETH_DAI_GAUGE);
        (0, chai_1.expect)(await destinationGauge.balanceOf(sender.address)).to.be.equal(0);
        // We use the relayer as the intermediate token holder as that saves gas (since there's fewer transfers, relayer
        // permission checks, etc.) and also sidesteps the issue that not all BPT has Vault allowance (which is required to
        // transfer them via the Vault, e.g. for staking).
        const stakedBalance = await (await task.instanceAt('IERC20', ETH_STETH_GAUGE)).balanceOf(sender.address);
        // There's no chained output here as the input equals the output
        const unstakeCalldata = library.interface.encodeFunctionData('gaugeWithdraw', [
            ETH_STETH_GAUGE,
            sender.address,
            relayer.address,
            stakedBalance,
        ]);
        // Exit into WETH (it'd be more expensive to use ETH, and we'd have to use the relayer as an intermediary as we'd
        // need to use said ETH).
        const ethStethTokens = (await vault.getPoolTokens(ETH_STETH_POOL)).tokens;
        const stableWethIndex = ethStethTokens.findIndex((token) => token.toLowerCase() == WETH.toLowerCase());
        const exitCalldata = library.interface.encodeFunctionData('exitPool', [
            ETH_STETH_POOL,
            0,
            // happens to match here
            relayer.address,
            relayer.address,
            {
                assets: ethStethTokens,
                minAmountsOut: ethStethTokens.map(() => 0),
                // Note that we use the same input as before
                userData: abi_coder_1.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256'], [0, stakedBalance, stableWethIndex]),
                toInternalBalance: true,
            },
            // Only store a chained reference for the WETH amount out, as the rest will be zero
            [{ key: toChainedReference(42), index: stableWethIndex }],
        ]);
        // Join from WETH
        const ethDaiTokens = (await vault.getPoolTokens(ETH_DAI_POOL)).tokens;
        const ethDaiAmountsIn = ethDaiTokens.map((token) => token.toLowerCase() == WETH.toLowerCase() ? toChainedReference(42) : 0);
        const joinCalldata = library.interface.encodeFunctionData('joinPool', [
            ETH_DAI_POOL,
            0,
            relayer.address,
            relayer.address,
            {
                assets: ethDaiTokens,
                maxAmountsIn: ethDaiTokens.map(() => constants_1.MAX_UINT256),
                userData: encoder_1.WeightedPoolEncoder.joinExactTokensInForBPTOut(ethDaiAmountsIn, 0),
                fromInternalBalance: true, // Since we're joining from internal balance, we don't need to grant token allowance
            },
            0,
            toChainedReference(17), // Store a reference for later staking
        ]);
        const stakeCalldata = library.interface.encodeFunctionData('gaugeDeposit', [
            ETH_DAI_GAUGE,
            relayer.address,
            sender.address,
            toChainedReference(17), // Stake all BPT from the join
        ]);
        await relayer.connect(sender).multicall([unstakeCalldata, exitCalldata, joinCalldata, stakeCalldata]);
        (0, chai_1.expect)(await destinationGauge.balanceOf(sender.address)).to.be.gt(0);
    });
});
