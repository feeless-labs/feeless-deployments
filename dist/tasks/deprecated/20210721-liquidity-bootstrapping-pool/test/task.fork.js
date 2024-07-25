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
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const types_1 = require("@helpers/models/types/types");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const math_1 = require("@helpers/models/pools/weighted/math");
const relativeError_1 = require("@helpers/relativeError");
const time_1 = require("@helpers/time");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('LiquidityBootstrappingPoolFactory', 'mainnet', 14850000, function () {
    let owner, whale;
    let pool, factory, vault, usdc, dai;
    let task;
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const tokens = [DAI, USDC];
    const initialWeights = [(0, numbers_1.fp)(0.9), (0, numbers_1.fp)(0.1)];
    const swapFeePercentage = (0, numbers_1.fp)(0.01);
    const swapEnabledOnStart = true;
    const weightChangeDuration = time_1.MONTH;
    const endWeights = [(0, numbers_1.fp)(0.2), (0, numbers_1.fp)(0.8)];
    let endTime;
    const initialBalanceDAI = (0, numbers_1.fp)(9e6); // 9:1 DAI:USDC ratio
    const initialBalanceUSDC = (0, numbers_1.fp)(1e6).div(1e12); // 6 digits
    const initialBalances = [initialBalanceDAI, initialBalanceUSDC];
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    before('run task', async () => {
        task = new _src_1.Task('20210721-liquidity-bootstrapping-pool', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('LiquidityBootstrappingPoolFactory');
    });
    before('load signers', async () => {
        owner = await (0, _src_1.getSigner)();
        whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
    });
    before('load vault and tokens', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', await factory.getVault());
        dai = await task.instanceAt('IERC20', DAI);
        usdc = await task.instanceAt('IERC20', USDC);
    });
    it('deploy a liquidity bootstrapping pool', async () => {
        const tx = await factory.create('LBP', 'LBPT', tokens, initialWeights, swapFeePercentage, owner.address, swapEnabledOnStart);
        const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
        pool = await task.instanceAt('LiquidityBootstrappingPool', event.args.pool);
        (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
        const poolId = pool.getPoolId();
        const [registeredAddress] = await vault.getPool(poolId);
        (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
    });
    it('initialize a liquidity bootstrapping pool from the owner', async () => {
        // Only the owner can seed the pool, so we send them tokens from the whale
        await dai.connect(whale).transfer(owner.address, initialBalanceDAI);
        await usdc.connect(whale).transfer(owner.address, initialBalanceUSDC);
        // Approve the Vault to join
        await dai.connect(owner).approve(vault.address, constants_1.MAX_UINT256);
        await usdc.connect(owner).approve(vault.address, constants_1.MAX_UINT256);
        const poolId = await pool.getPoolId();
        const userData = encoder_1.WeightedPoolEncoder.joinInit(initialBalances);
        await vault.connect(owner).joinPool(poolId, owner.address, owner.address, {
            assets: tokens,
            maxAmountsIn: initialBalances,
            fromInternalBalance: false,
            userData,
        });
        const scaledBalances = [initialBalanceDAI, initialBalanceUSDC.mul(1e12)];
        // Initial BPT is the invariant multiplied by the number of tokens
        const expectedInvariant = (0, math_1.calculateInvariant)(scaledBalances, initialWeights).mul(tokens.length);
        (0, relativeError_1.expectEqualWithError)(await pool.balanceOf(owner.address), expectedInvariant, 0.001);
    });
    it('can swap in a liquidity bootstrapping pool', async () => {
        const amount = (0, numbers_1.fp)(500); // Small relative to Pool balance - should have zero price impact
        await dai.connect(whale).approve(vault.address, amount);
        const poolId = await pool.getPoolId();
        const whaleUSDCBalanceBefore = await usdc.balanceOf(whale.address);
        await vault
            .connect(whale)
            .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: DAI, assetOut: USDC, amount, userData: '0x' }, { sender: whale.address, recipient: whale.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
        const whaleUSDCBalanceAfter = await usdc.balanceOf(whale.address);
        // Assert pool swap
        const expectedUSDC = amount.div(1e12);
        (0, relativeError_1.expectEqualWithError)(whaleUSDCBalanceAfter.sub(whaleUSDCBalanceBefore), expectedUSDC, 0.1);
    });
    it('initial weights are correct', async () => {
        // Weights are not exact due to being stored in fewer bits
        (0, chai_1.expect)(await pool.getNormalizedWeights()).to.equalWithError(initialWeights, 0.0001);
    });
    it('owner can start a gradual weight change', async () => {
        const startTime = (await (0, time_1.currentTimestamp)()).add(time_1.DAY);
        endTime = startTime.add(weightChangeDuration);
        const tx = await pool.connect(owner).updateWeightsGradually(startTime, endTime, endWeights);
        expectEvent.inReceipt(await tx.wait(), 'GradualWeightUpdateScheduled');
        const params = await pool.getGradualWeightUpdateParams();
        (0, chai_1.expect)(params.startTime).to.equal(startTime);
        (0, chai_1.expect)(params.endTime).to.equal(endTime);
        (0, chai_1.expect)(params.endWeights).to.equalWithError(endWeights, 0.0001);
    });
    it('weights fully change once the time expires', async () => {
        await (0, time_1.advanceToTimestamp)(endTime.add(time_1.MINUTE));
        // Weights are not exact due to being stored in fewer bits
        (0, chai_1.expect)(await pool.getNormalizedWeights()).to.equalWithError(endWeights, 0.0001);
    });
});
