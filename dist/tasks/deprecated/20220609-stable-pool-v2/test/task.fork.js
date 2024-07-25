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
const encoder_1 = require("@helpers/models/pools/utils/encoder");
const encoder_2 = require("@helpers/models/pools/stable/encoder");
const types_1 = require("@helpers/models/types/types");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const math_1 = require("@helpers/models/pools/stable/math");
const relativeError_1 = require("@helpers/relativeError");
const actions_1 = require("@helpers/models/misc/actions");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('StablePoolFactory', 'mainnet', 14850000, function () {
    let owner, whale, govMultisig;
    let factory, vault, authorizer, usdc, dai, usdt;
    let task;
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
    const tokens = [DAI, USDC];
    const amplificationParameter = (0, numbers_1.bn)(100);
    const swapFeePercentage = (0, numbers_1.fp)(0.01);
    const initialBalanceDAI = (0, numbers_1.fp)(1e6);
    const initialBalanceUSDC = (0, numbers_1.fp)(1e6).div(1e12); // 6 digits
    const initialBalances = [initialBalanceDAI, initialBalanceUSDC];
    const upscaledInitialBalances = [initialBalanceDAI, initialBalanceUSDC.mul(1e12)];
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    before('run task', async () => {
        task = new _src_1.Task('20220609-stable-pool-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('StablePoolFactory');
    });
    before('load signers', async () => {
        owner = await (0, _src_1.getSigner)();
        whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
        govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        dai = await task.instanceAt('IERC20', DAI);
        usdc = await task.instanceAt('IERC20', USDC);
        usdt = await task.instanceAt('IERC20', USDT);
    });
    describe('create and swap', () => {
        let pool;
        let poolId;
        it('deploy a stable pool', async () => {
            const tx = await factory.create('', '', tokens, amplificationParameter, swapFeePercentage, owner.address);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            pool = await task.instanceAt('StablePool', event.args.pool);
            (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
        });
        it('initialize the pool', async () => {
            await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            const userData = encoder_2.StablePoolEncoder.joinInit(initialBalances);
            await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                assets: tokens,
                maxAmountsIn: initialBalances,
                fromInternalBalance: false,
                userData,
            });
            const { balances } = await vault.getPoolTokens(poolId);
            (0, chai_1.expect)(balances).to.deep.equal(initialBalances);
            const expectedInvariant = (0, math_1.calculateInvariant)(upscaledInitialBalances, amplificationParameter);
            (0, relativeError_1.expectEqualWithError)(await pool.balanceOf(owner.address), expectedInvariant, 0.001);
        });
        it('swap in the pool', async () => {
            const amount = (0, numbers_1.fp)(500);
            await dai.connect(whale).transfer(owner.address, amount);
            await dai.connect(owner).approve(vault.address, amount);
            await vault
                .connect(owner)
                .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: DAI, assetOut: USDC, amount, userData: '0x' }, { sender: owner.address, recipient: owner.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
            // Assert pool swap
            const expectedUSDC = amount.div(1e12);
            (0, relativeError_1.expectEqualWithError)(await dai.balanceOf(owner.address), 0, 0.0001);
            (0, relativeError_1.expectEqualWithError)(await usdc.balanceOf(owner.address), expectedUSDC, 0.1);
        });
    });
    describe('extremely unbalanced pools', () => {
        it('the invariant converges', async () => {
            const unbalancedTokens = [DAI, USDC, USDT];
            const unbalancedBalanceDAI = (0, numbers_1.fp)(0.00000001);
            const unbalancedBalanceUSDC = (0, numbers_1.fp)(1200000000).div(1e12); // 6 digits
            const unbalancedBalanceUSDT = (0, numbers_1.fp)(300).div(1e12); // 6 digits
            const unbalancedBalances = [unbalancedBalanceDAI, unbalancedBalanceUSDC, unbalancedBalanceUSDT];
            const upscaledUnbalancedBalances = [
                unbalancedBalanceDAI,
                unbalancedBalanceUSDC.mul(1e12),
                unbalancedBalanceUSDT.mul(1e12),
            ];
            const tx = await factory.create('', '', unbalancedTokens, amplificationParameter, swapFeePercentage, owner.address);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            const pool = await task.instanceAt('StablePool', event.args.pool);
            const poolId = await pool.getPoolId();
            // Initialize the pool
            await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await usdt.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            const userData = encoder_2.StablePoolEncoder.joinInit(unbalancedBalances);
            await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                assets: unbalancedTokens,
                maxAmountsIn: unbalancedBalances,
                fromInternalBalance: false,
                userData,
            });
            // The fact that joining the pool did not revert is proof enough that the invariant converges, but we can also
            // explicitly check the last invariant.
            const expectedInvariant = (0, math_1.calculateInvariant)(upscaledUnbalancedBalances, amplificationParameter);
            const [lastInvariant] = await pool.getLastInvariant();
            (0, relativeError_1.expectEqualWithError)(lastInvariant, expectedInvariant, 0.001);
        });
    });
    describe('recovery mode', () => {
        let pool;
        let poolId;
        before('deploy and initialize a stable pool', async () => {
            const tx = await factory.create('', '', tokens, amplificationParameter, swapFeePercentage, owner.address);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            pool = await task.instanceAt('StablePool', event.args.pool);
            poolId = await pool.getPoolId();
            await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            const userData = encoder_2.StablePoolEncoder.joinInit(initialBalances);
            await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                assets: tokens,
                maxAmountsIn: initialBalances,
                fromInternalBalance: false,
                userData,
            });
        });
        before('enter recovery mode', async () => {
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(pool, 'enableRecoveryMode'), govMultisig.address);
            await pool.connect(govMultisig).enableRecoveryMode();
            (0, chai_1.expect)(await pool.inRecoveryMode()).to.be.true;
        });
        it('can exit via recovery mode', async () => {
            const bptBalance = await pool.balanceOf(owner.address);
            (0, chai_1.expect)(bptBalance).to.gt(0);
            const vaultUSDCBalanceBeforeExit = await usdc.balanceOf(vault.address);
            const ownerUSDCBalanceBeforeExit = await usdc.balanceOf(owner.address);
            const userData = encoder_1.BasePoolEncoder.recoveryModeExit(bptBalance);
            await vault.connect(owner).exitPool(poolId, owner.address, owner.address, {
                assets: tokens,
                minAmountsOut: Array(tokens.length).fill(0),
                fromInternalBalance: false,
                userData,
            });
            const remainingBalance = await pool.balanceOf(owner.address);
            (0, chai_1.expect)(remainingBalance).to.equal(0);
            const vaultUSDCBalanceAfterExit = await usdc.balanceOf(vault.address);
            const ownerUSDCBalanceAfterExit = await usdc.balanceOf(owner.address);
            (0, chai_1.expect)(vaultUSDCBalanceAfterExit).to.lt(vaultUSDCBalanceBeforeExit);
            (0, chai_1.expect)(ownerUSDCBalanceAfterExit).to.gt(ownerUSDCBalanceBeforeExit);
        });
    });
    describe('factory disable', () => {
        it('the factory can be disabled', async () => {
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(factory, 'disable'), govMultisig.address);
            await factory.connect(govMultisig).disable();
            (0, chai_1.expect)(await factory.isDisabled()).to.be.true;
            await (0, chai_1.expect)(factory.create('', '', tokens, amplificationParameter, swapFeePercentage, owner.address)).to.be.revertedWith('BAL#211');
        });
    });
});
