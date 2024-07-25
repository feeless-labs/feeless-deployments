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
exports.SwapKind = void 0;
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
var SwapKind;
(function (SwapKind) {
    SwapKind[SwapKind["GivenIn"] = 0] = "GivenIn";
    SwapKind[SwapKind["GivenOut"] = 1] = "GivenOut";
})(SwapKind = exports.SwapKind || (exports.SwapKind = {}));
(0, _src_2.describeForkTest)('SiloLinearPoolFactory', 'mainnet', 16478568, function () {
    let owner, holder, other;
    let factory, vault, usdc;
    let rebalancer;
    let task;
    // USDC Mainnet address
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    // Share Token address for USDC
    const sUSDC = '0x416DE9AD46C53AAAb2352F91120952393946d2ac';
    // USDC holder address
    const USDC_HOLDER = '0xda9ce944a37d218c3302f6b82a094844c6eceb17';
    // USDC Silo Address
    const USDC_SILO = '0xfccc27aabd0ab7a0b2ad2b7760037b1eab61616b';
    // Scaling factory is 1e12 due to USDC only having 6 decimals
    const USDC_SCALING = (0, numbers_1.bn)(1e12);
    const SWAP_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01); // 1%
    // The targets are set using 18 decimals, even if the token has fewer (as is the case for USDC);
    const INITIAL_UPPER_TARGET = (0, numbers_1.fp)(1e6);
    // The initial midpoint (upper target / 2) must be between the final lower and upper targets
    const FINAL_LOWER_TARGET = (0, numbers_1.fp)(0.2e6);
    const FINAL_UPPER_TARGET = (0, numbers_1.fp)(5e6);
    const PROTOCOL_ID = 5;
    let pool;
    let poolId;
    before('run task', async () => {
        task = new _src_1.Task('20230315-silo-linear-pool', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('SiloLinearPoolFactory');
    });
    before('load signers', async () => {
        [, owner, other] = await (0, _src_1.getSigners)();
        holder = await (0, _src_1.impersonate)(USDC_HOLDER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        usdc = await task.instanceAt('IERC20', USDC);
        await usdc.connect(holder).approve(vault.address, constants_1.MAX_UINT256);
    });
    let LinearPoolState;
    (function (LinearPoolState) {
        LinearPoolState[LinearPoolState["BALANCED"] = 0] = "BALANCED";
        LinearPoolState[LinearPoolState["MAIN_EXCESS"] = 1] = "MAIN_EXCESS";
        LinearPoolState[LinearPoolState["MAIN_LACK"] = 2] = "MAIN_LACK";
    })(LinearPoolState || (LinearPoolState = {}));
    function itRebalancesThePool(expectedState) {
        it('rebalance the pool', async () => {
            const { lowerTarget, upperTarget } = await pool.getTargets();
            const { cash } = await vault.getPoolTokenInfo(poolId, USDC);
            const scaledCash = cash.mul(USDC_SCALING);
            let fees;
            if (scaledCash.gt(upperTarget)) {
                (0, chai_1.expect)(expectedState).to.equal(LinearPoolState.MAIN_EXCESS);
                const excess = scaledCash.sub(upperTarget);
                fees = excess.mul(SWAP_FEE_PERCENTAGE).div(numbers_1.FP_ONE);
            }
            else if (scaledCash.lt(lowerTarget)) {
                (0, chai_1.expect)(expectedState).to.equal(LinearPoolState.MAIN_LACK);
                const lack = lowerTarget.sub(scaledCash);
                fees = lack.mul(SWAP_FEE_PERCENTAGE).div(numbers_1.FP_ONE);
            }
            else {
                (0, chai_1.expect)(expectedState).to.equal(LinearPoolState.BALANCED);
                fees = 0;
            }
            const initialRecipientMainBalance = await usdc.balanceOf(other.address);
            if (expectedState != LinearPoolState.BALANCED) {
                await rebalancer.connect(holder).rebalance(other.address);
            }
            else {
                await rebalancer.connect(holder).rebalanceWithExtraMain(other.address, 5);
            }
            const finalRecipientMainBalance = await usdc.balanceOf(other.address);
            if (fees > 0) {
                // The recipient of the rebalance call should get the fees that were collected (though there's some rounding
                // error in the main-wrapped conversion).
                (0, chai_1.expect)(finalRecipientMainBalance.sub(initialRecipientMainBalance)).to.be.almostEqual(fees.div(USDC_SCALING), 0.000001);
            }
            else {
                // The recipient of the rebalance call will get any extra main tokens that were not utilized.
                (0, chai_1.expect)(finalRecipientMainBalance).to.be.almostEqual(initialRecipientMainBalance, 0.000001);
            }
            const mainInfo = await vault.getPoolTokenInfo(poolId, USDC);
            const expectedMainBalance = lowerTarget.add(upperTarget).div(2);
            (0, chai_1.expect)(mainInfo.cash.mul(USDC_SCALING)).to.equal(expectedMainBalance);
            (0, chai_1.expect)(mainInfo.managed).to.equal(0);
        });
    }
    describe('create and check getters', () => {
        it('deploy a linear pool', async () => {
            const tx = await factory.create('USDC', 'sUSDC', USDC, sUSDC, INITIAL_UPPER_TARGET, SWAP_FEE_PERCENTAGE, owner.address, PROTOCOL_ID);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            pool = await task.instanceAt('SiloLinearPool', event.args.pool);
            (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
            const { assetManager } = await vault.getPoolTokenInfo(poolId, USDC); // We could query for either frxEth or SiloToken
            rebalancer = await task.instanceAt('SiloLinearPoolRebalancer', assetManager);
            await usdc.connect(holder).approve(rebalancer.address, constants_1.MAX_UINT256); // To send extra main on rebalance
        });
        it('check factory version', async () => {
            const expectedFactoryVersion = {
                name: 'SiloLinearPoolFactory',
                version: 1,
                deployment: '20230315-silo-linear-pool',
            };
            (0, chai_1.expect)(await factory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
        it('check pool version', async () => {
            const expectedPoolVersion = {
                name: 'SiloLinearPool',
                version: 1,
                deployment: '20230315-silo-linear-pool',
            };
            (0, chai_1.expect)(await pool.version()).to.equal(JSON.stringify(expectedPoolVersion));
        });
    });
    describe('join, and rebalance', () => {
        it('join the pool', async () => {
            // We're going to join with enough main token to bring the Pool above its upper target, which will let us later
            // rebalance.
            const joinAmount = INITIAL_UPPER_TARGET.mul(2).div(USDC_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: USDC,
                assetOut: pool.address,
                amount: joinAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
            // Assert join amount - some fees will be collected as we're going over the upper target.
            const excess = joinAmount.mul(USDC_SCALING).sub(INITIAL_UPPER_TARGET);
            const joinCollectedFees = excess.mul(SWAP_FEE_PERCENTAGE).div(numbers_1.FP_ONE);
            const expectedBPT = joinAmount.mul(USDC_SCALING).sub(joinCollectedFees);
            (0, chai_1.expect)(await pool.balanceOf(holder.address)).to.equal(expectedBPT);
        });
        itRebalancesThePool(LinearPoolState.MAIN_EXCESS);
        it('set final targets', async () => {
            await pool.connect(owner).setTargets(FINAL_LOWER_TARGET, FINAL_UPPER_TARGET);
        });
    });
    describe('generate excess of main token and rebalance', () => {
        it('deposit main tokens', async () => {
            // We're going to join with enough main token to bring the Pool above its upper target, which will let us later
            // rebalance.
            const { upperTarget } = await pool.getTargets();
            const joinAmount = upperTarget.mul(5).div(USDC_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: USDC,
                assetOut: pool.address,
                amount: joinAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
        });
        itRebalancesThePool(LinearPoolState.MAIN_EXCESS);
    });
    describe('generate lack of main token and rebalance', () => {
        it('withdraw main tokens', async () => {
            // We're going to withdraw enough man token to bring the Pool below its lower target, which will let us later
            // rebalance.
            const { cash } = await vault.getPoolTokenInfo(poolId, USDC);
            const scaledCash = cash.mul(USDC_SCALING);
            const { lowerTarget } = await pool.getTargets();
            const exitAmount = scaledCash.sub(lowerTarget.div(3)).div(USDC_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: USDC,
                amount: exitAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, constants_1.MAX_UINT256, constants_1.MAX_UINT256);
        });
        itRebalancesThePool(LinearPoolState.MAIN_LACK);
    });
    describe('join below upper target and rebalance', () => {
        it('deposit main tokens', async () => {
            // We're going to join with few tokens, causing the Pool to not reach its upper target.
            const { lowerTarget, upperTarget } = await pool.getTargets();
            const midpoint = lowerTarget.add(upperTarget).div(2);
            const joinAmount = midpoint.div(100).div(USDC_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: USDC,
                assetOut: pool.address,
                amount: joinAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
        });
        itRebalancesThePool(LinearPoolState.BALANCED);
    });
    describe('exit above lower target and rebalance', () => {
        it('withdraw main tokens', async () => {
            // We're going to exit with few tokens, causing for the Pool to not reach its lower target.
            const { lowerTarget, upperTarget } = await pool.getTargets();
            const midpoint = lowerTarget.add(upperTarget).div(2);
            const exitAmount = midpoint.div(100).div(USDC_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: USDC,
                amount: exitAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, constants_1.MAX_UINT256, constants_1.MAX_UINT256);
        });
        itRebalancesThePool(LinearPoolState.BALANCED);
    });
    describe('rebalance repeatedly', () => {
        itRebalancesThePool(LinearPoolState.BALANCED);
        itRebalancesThePool(LinearPoolState.BALANCED);
    });
    describe('rebalancer query protection', async () => {
        it('reverts with a malicious lending pool', async () => {
            const { cash } = await vault.getPoolTokenInfo(poolId, USDC);
            const scaledCash = cash.mul(USDC_SCALING);
            const { lowerTarget } = await pool.getTargets();
            const exitAmount = scaledCash.sub(lowerTarget.div(3)).div(USDC_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: USDC,
                amount: exitAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, constants_1.MAX_UINT256, constants_1.MAX_UINT256);
            // Using MockSilo from 20230410-silo-linear-pool-v2
            await (0, hardhat_network_helpers_1.setCode)(USDC_SILO, (0, _src_3.getArtifact)('MockSilo').deployedBytecode);
            const mockLendingPool = await (0, _src_3.instanceAt)('MockSilo', USDC_SILO);
            await mockLendingPool.setRevertType(2); // Type 2 is malicious swap query revert
            await (0, chai_1.expect)(rebalancer.rebalance(other.address)).to.be.revertedWith('BAL#357'); // MALICIOUS_QUERY_REVERT
        });
    });
});
