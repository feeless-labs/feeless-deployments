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
const encoder_1 = require("@helpers/models/pools/stable/encoder");
const types_1 = require("@helpers/models/types/types");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const math_1 = require("@helpers/models/pools/stable/math");
const relativeError_1 = require("@helpers/relativeError");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('StablePoolFactory', 'mainnet', 14850000, function () {
    let owner, whale;
    let pool, factory, vault, usdc, dai;
    let task;
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const tokens = [DAI, USDC];
    const amplificationParameter = (0, numbers_1.bn)(100);
    const swapFeePercentage = (0, numbers_1.fp)(0.01);
    const initialBalanceDAI = (0, numbers_1.fp)(1e6);
    const initialBalanceUSDC = (0, numbers_1.fp)(1e6).div(1e12); // 6 digits
    const initialBalances = [initialBalanceDAI, initialBalanceUSDC];
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    before('run task', async () => {
        task = new _src_1.Task('20210624-stable-pool', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('StablePoolFactory');
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
    it('deploy a stable pool', async () => {
        const tx = await factory.create('SP', 'SPT', tokens, amplificationParameter, swapFeePercentage, owner.address);
        const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
        pool = await task.instanceAt('StablePool', event.args.pool);
        (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
        const poolId = pool.getPoolId();
        const [registeredAddress] = await vault.getPool(poolId);
        (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
    });
    it('can initialize a stable pool', async () => {
        await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        const poolId = await pool.getPoolId();
        const userData = encoder_1.StablePoolEncoder.joinInit(initialBalances);
        await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
            assets: tokens,
            maxAmountsIn: initialBalances,
            fromInternalBalance: false,
            userData,
        });
        const expectedInvariant = (0, math_1.calculateInvariant)([initialBalanceDAI, initialBalanceDAI], amplificationParameter);
        (0, relativeError_1.expectEqualWithError)(await pool.balanceOf(owner.address), expectedInvariant, 0.001);
    });
    it('can swap in a stable pool', async () => {
        const amount = (0, numbers_1.fp)(500);
        await dai.connect(whale).transfer(owner.address, amount);
        await dai.connect(owner).approve(vault.address, amount);
        const poolId = await pool.getPoolId();
        await vault
            .connect(owner)
            .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: DAI, assetOut: USDC, amount, userData: '0x' }, { sender: owner.address, recipient: owner.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
        // Assert pool swap
        const expectedUSDC = amount.div(1e12);
        (0, relativeError_1.expectEqualWithError)(await dai.balanceOf(owner.address), 0, 0.0001);
        (0, relativeError_1.expectEqualWithError)(await usdc.balanceOf(owner.address), expectedUSDC, 0.1);
    });
});
