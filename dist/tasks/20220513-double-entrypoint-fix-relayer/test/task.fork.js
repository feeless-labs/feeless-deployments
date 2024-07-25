"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const abi_1 = require("@ethersproject/abi");
const actions_1 = require("@helpers/models/misc/actions");
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('DoubleEntrypointFixRelayer', 'mainnet', 14770592, function () {
    let govMultisig;
    let btcBptHolder, snxBptHolder;
    let relayer;
    let vault, balancerHelpers, authorizer, protocolFeesCollector;
    let wBTCContract, renBTCContract, sBTCContract;
    let wethContract, snxContract;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const BTC_STABLE_POOL_GAUGE = '0x57d40FF4cF7441A04A05628911F57bb940B6C238';
    const SNX_WEIGHTED_POOL_GAUGE = '0x605eA53472A496c3d483869Fe8F355c12E861e19';
    const BTC_STABLE_POOL_ID = '0xfeadd389a5c427952d8fdb8057d6c8ba1156cc56000000000000000000000066';
    const BTC_STABLE_POOL_ADDRESS = '0xFeadd389a5c427952D8fdb8057D6C8ba1156cC56';
    const wBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
    const renBTC = '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d';
    const sBTC = '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6';
    const sBTC_IMPLEMENTATION = '0x18FcC34bdEaaF9E3b69D2500343527c0c995b1d6';
    const SNX_WEIGHTED_POOL_ID = '0x072f14b85add63488ddad88f855fda4a99d6ac9b000200000000000000000027';
    const SNX_WEIGHTED_POOL_ADDRESS = '0x072f14B85ADd63488DDaD88f855Fda4A99d6aC9B';
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const SNX = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';
    const SNX_IMPLEMENTATION = '0x639032d3900875a4cf4960aD6b9ee441657aA93C';
    before('run task', async () => {
        task = new _src_1.Task('20220513-double-entrypoint-fix-relayer', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        relayer = await task.deployedInstance('DoubleEntrypointFixRelayer');
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        balancerHelpers = await vaultTask.deployedInstance('BalancerHelpers');
        protocolFeesCollector = await vaultTask.instanceAt('ProtocolFeesCollector', await vault.getProtocolFeesCollector());
        // We reuse this task as it contains an ABI for an ERC20 token
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        wBTCContract = await testBALTokenTask.instanceAt('TestBalancerToken', wBTC);
        renBTCContract = await testBALTokenTask.instanceAt('TestBalancerToken', renBTC);
        sBTCContract = await testBALTokenTask.instanceAt('TestBalancerToken', sBTC);
        wethContract = await testBALTokenTask.instanceAt('TestBalancerToken', WETH);
        snxContract = await testBALTokenTask.instanceAt('TestBalancerToken', SNX);
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        // Gov approval for relayer
        const exitPoolRole = await (0, actions_1.actionId)(vault, 'exitPool');
        const withdrawCollectedFeesRole = await (0, actions_1.actionId)(protocolFeesCollector, 'withdrawCollectedFees');
        await authorizer.connect(govMultisig).grantRoles([exitPoolRole, withdrawCollectedFeesRole], relayer.address);
        // User approval for relayer
        btcBptHolder = await (0, _src_1.impersonate)(BTC_STABLE_POOL_GAUGE);
        await vault.connect(btcBptHolder).setRelayerApproval(btcBptHolder.address, relayer.address, true);
        snxBptHolder = await (0, _src_1.impersonate)(SNX_WEIGHTED_POOL_GAUGE);
        await vault.connect(snxBptHolder).setRelayerApproval(snxBptHolder.address, relayer.address, true);
    });
    it('sweeps sBTC', async () => {
        const vaultBalanceBefore = await sBTCContract.balanceOf(vault.address);
        const protocolFeesCollectorBalanceBefore = await sBTCContract.balanceOf(protocolFeesCollector.address);
        await relayer.sweepDoubleEntrypointToken([sBTC_IMPLEMENTATION, sBTC]);
        const vaultBalanceAfter = await sBTCContract.balanceOf(vault.address);
        const protocolFeesCollectorBalanceAfter = await sBTCContract.balanceOf(protocolFeesCollector.address);
        (0, chai_1.expect)(vaultBalanceAfter).to.be.eq(0);
        (0, chai_1.expect)(protocolFeesCollectorBalanceAfter.sub(protocolFeesCollectorBalanceBefore)).to.be.eq(vaultBalanceBefore);
    });
    it('exits from the sBTC pool', async () => {
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        const poolContract = await testBALTokenTask.instanceAt('TestBalancerToken', BTC_STABLE_POOL_ADDRESS);
        const EXACT_BPT_IN_FOR_TOKENS_OUT = 1;
        const [, expectedAmountsOut] = await balancerHelpers.callStatic.queryExit(BTC_STABLE_POOL_ID, btcBptHolder.address, btcBptHolder.address, {
            assets: [wBTC, renBTC, sBTC],
            minAmountsOut: [0, 0, 0],
            // The helper used to encode user data has been removed; this is how it was encoded in the original fork test.
            userData: abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [EXACT_BPT_IN_FOR_TOKENS_OUT, await poolContract.balanceOf(btcBptHolder.address)]),
            toInternalBalance: false,
        });
        await relayer.connect(btcBptHolder).exitBTCStablePool();
        const actualAmountsOut = await Promise.all([wBTCContract, renBTCContract, sBTCContract].map((token) => token.balanceOf(btcBptHolder.address)));
        (0, chai_1.expect)(await poolContract.balanceOf(btcBptHolder.address)).to.be.eq(0);
        (0, chai_1.expect)(expectedAmountsOut).to.be.deep.eq(actualAmountsOut);
        const vaultBalanceAfter = await sBTCContract.balanceOf(vault.address);
        (0, chai_1.expect)(vaultBalanceAfter).to.be.eq(0);
    });
    it('sweeps SNX', async () => {
        const vaultBalanceBefore = await snxContract.balanceOf(vault.address);
        const protocolFeesCollectorBalanceBefore = await snxContract.balanceOf(protocolFeesCollector.address);
        await relayer.sweepDoubleEntrypointToken([SNX_IMPLEMENTATION, SNX]);
        const vaultBalanceAfter = await snxContract.balanceOf(vault.address);
        const protocolFeesCollectorBalanceAfter = await snxContract.balanceOf(protocolFeesCollector.address);
        (0, chai_1.expect)(vaultBalanceAfter).to.be.eq(0);
        (0, chai_1.expect)(protocolFeesCollectorBalanceAfter.sub(protocolFeesCollectorBalanceBefore)).to.be.eq(vaultBalanceBefore);
    });
    it('exits from the SNX pool', async () => {
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        const poolContract = await testBALTokenTask.instanceAt('TestBalancerToken', SNX_WEIGHTED_POOL_ADDRESS);
        const [, expectedAmountsOut] = await balancerHelpers.callStatic.queryExit(SNX_WEIGHTED_POOL_ID, snxBptHolder.address, snxBptHolder.address, {
            assets: [SNX, WETH],
            minAmountsOut: [0, 0],
            userData: encoder_1.WeightedPoolEncoder.exitExactBPTInForTokensOut(await poolContract.balanceOf(snxBptHolder.address)),
            toInternalBalance: false,
        });
        await relayer.connect(snxBptHolder).exitSNXWeightedPool();
        const actualAmountsOut = await Promise.all([snxContract, wethContract].map((token) => token.balanceOf(snxBptHolder.address)));
        (0, chai_1.expect)(await poolContract.balanceOf(snxBptHolder.address)).to.be.eq(0);
        (0, chai_1.expect)(expectedAmountsOut).to.be.deep.eq(actualAmountsOut);
        const vaultBalanceAfter = await snxContract.balanceOf(vault.address);
        (0, chai_1.expect)(vaultBalanceAfter).to.be.eq(0);
    });
});
