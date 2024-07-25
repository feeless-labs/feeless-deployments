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
const utils_1 = require("ethers/lib/utils");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const types_1 = require("@helpers/models/types/types");
const _src_2 = require("@src");
(0, _src_2.describeForkTest)('AaveLinearPoolFactory V5', 'mainnet', 16592300, function () {
    let owner, holder, other;
    let factory, vault, usdt;
    let rebalancer;
    let task;
    const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const waUSDT = '0xf8Fd466F12e236f4c96F7Cce6c79EAdB819abF58';
    const USDT_LENDING_POOL = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
    const USDT_SCALING = (0, numbers_1.bn)(1e12); // USDT has 6 decimals, so its scaling factor is 1e12
    const USDT_HOLDER = '0x5754284f345afc66a98fbb0a0afe71e0f007b949';
    const SWAP_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01); // 1%
    // The targets are set using 18 decimals, even if the token has fewer (as is the case for USDT);
    const INITIAL_UPPER_TARGET = (0, numbers_1.fp)(1e7);
    // The initial midpoint (upper target / 2) must be between the final lower and upper targets
    const FINAL_LOWER_TARGET = (0, numbers_1.fp)(0.2e7);
    const FINAL_UPPER_TARGET = (0, numbers_1.fp)(5e7);
    const PROTOCOL_ID = 0;
    const TASK_NAME = '20230410-aave-linear-pool-v5';
    const VERSION = 5;
    const SALT = (0, utils_1.randomBytes)(32);
    let AttackType;
    (function (AttackType) {
        AttackType[AttackType["SET_TARGETS"] = 0] = "SET_TARGETS";
        AttackType[AttackType["SET_SWAP_FEE"] = 1] = "SET_SWAP_FEE";
    })(AttackType || (AttackType = {}));
    let pool;
    let poolId;
    before('run task', async () => {
        task = new _src_2.Task(TASK_NAME, _src_2.TaskMode.TEST, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('AaveLinearPoolFactory');
    });
    before('load signers', async () => {
        [, owner, other] = await (0, _src_2.getSigners)();
        holder = await (0, _src_2.impersonate)(USDT_HOLDER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        vault = await new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        usdt = await task.instanceAt('IERC20', USDT);
        await usdt.connect(holder).approve(vault.address, constants_1.MAX_UINT256);
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
            const { cash } = await vault.getPoolTokenInfo(poolId, USDT);
            const scaledCash = cash.mul(USDT_SCALING);
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
            const initialRecipientMainBalance = await usdt.balanceOf(other.address);
            if (expectedState != LinearPoolState.BALANCED) {
                await rebalancer.connect(holder).rebalance(other.address);
            }
            else {
                await rebalancer.connect(holder).rebalanceWithExtraMain(other.address, 5);
            }
            const finalRecipientMainBalance = await usdt.balanceOf(other.address);
            if (fees > 0) {
                // The recipient of the rebalance call should get the fees that were collected (though there's some rounding
                // error in the main-wrapped conversion).
                (0, chai_1.expect)(finalRecipientMainBalance.sub(initialRecipientMainBalance)).to.be.almostEqual(fees.div(USDT_SCALING), 0.00000001);
            }
            else {
                // The recipient of the rebalance call will get any extra main tokens that were not utilized.
                (0, chai_1.expect)(finalRecipientMainBalance).to.be.almostEqual(initialRecipientMainBalance, 0.00000001);
            }
            const mainInfo = await vault.getPoolTokenInfo(poolId, USDT);
            const expectedMainBalance = lowerTarget.add(upperTarget).div(2);
            (0, chai_1.expect)(mainInfo.cash.mul(USDT_SCALING)).to.equal(expectedMainBalance);
            (0, chai_1.expect)(mainInfo.managed).to.equal(0);
        });
    }
    describe('create and check getters', () => {
        it('deploy a linear pool', async () => {
            const tx = await factory.create('', '', USDT, waUSDT, INITIAL_UPPER_TARGET, SWAP_FEE_PERCENTAGE, owner.address, PROTOCOL_ID, SALT);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            pool = await task.instanceAt('AaveLinearPool', event.args.pool);
            (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
            const { assetManager } = await vault.getPoolTokenInfo(poolId, USDT); // We could query for either USDT or waUSDT
            rebalancer = await task.instanceAt('AaveLinearPoolRebalancer', assetManager);
            await usdt.connect(holder).approve(rebalancer.address, constants_1.MAX_UINT256); // To send extra main on rebalance
        });
        it('check factory version', async () => {
            const expectedFactoryVersion = {
                name: 'AaveLinearPoolFactory',
                version: VERSION,
                deployment: TASK_NAME,
            };
            (0, chai_1.expect)(await factory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
        it('check pool version', async () => {
            const expectedPoolVersion = {
                name: 'AaveLinearPool',
                version: VERSION,
                deployment: TASK_NAME,
            };
            (0, chai_1.expect)(await pool.version()).to.equal(JSON.stringify(expectedPoolVersion));
        });
    });
    describe('join, and rebalance', () => {
        it('join the pool', async () => {
            // We're going to join with enough main token to bring the Pool above its upper target, which will let us later
            // rebalance.
            const joinAmount = INITIAL_UPPER_TARGET.mul(2).div(USDT_SCALING);
            await vault
                .connect(holder)
                .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: USDT, assetOut: pool.address, amount: joinAmount, userData: '0x' }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
            // Assert join amount - some fees will be collected as we're going over the upper target.
            const excess = joinAmount.mul(USDT_SCALING).sub(INITIAL_UPPER_TARGET);
            const joinCollectedFees = excess.mul(SWAP_FEE_PERCENTAGE).div(numbers_1.FP_ONE);
            const expectedBPT = joinAmount.mul(USDT_SCALING).sub(joinCollectedFees);
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
            const joinAmount = upperTarget.mul(5).div(USDT_SCALING);
            await vault
                .connect(holder)
                .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: USDT, assetOut: pool.address, amount: joinAmount, userData: '0x' }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
        });
        itRebalancesThePool(LinearPoolState.MAIN_EXCESS);
    });
    describe('generate lack of main token and rebalance', () => {
        it('withdraw main tokens', async () => {
            // We're going to withdraw enough man token to bring the Pool below its lower target, which will let us later
            // rebalance.
            const { cash } = await vault.getPoolTokenInfo(poolId, USDT);
            const scaledCash = cash.mul(USDT_SCALING);
            const { lowerTarget } = await pool.getTargets();
            const exitAmount = scaledCash.sub(lowerTarget.div(3)).div(USDT_SCALING);
            await vault.connect(holder).swap({
                kind: types_1.SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: USDT,
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
            const joinAmount = midpoint.div(100).div(USDT_SCALING);
            await vault
                .connect(holder)
                .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: USDT, assetOut: pool.address, amount: joinAmount, userData: '0x' }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
        });
        itRebalancesThePool(LinearPoolState.BALANCED);
    });
    describe('exit above lower target and rebalance', () => {
        it('withdraw main tokens', async () => {
            // We're going to exit with few tokens, causing for the Pool to not reach its lower target.
            const { lowerTarget, upperTarget } = await pool.getTargets();
            const midpoint = lowerTarget.add(upperTarget).div(2);
            const exitAmount = midpoint.div(100).div(USDT_SCALING);
            await vault.connect(holder).swap({
                kind: types_1.SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: USDT,
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
            const { cash } = await vault.getPoolTokenInfo(poolId, USDT);
            const scaledCash = cash.mul(USDT_SCALING);
            const { lowerTarget } = await pool.getTargets();
            const exitAmount = scaledCash.sub(lowerTarget.div(3)).div(USDT_SCALING);
            await vault.connect(holder).swap({
                kind: types_1.SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: USDT,
                amount: exitAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, constants_1.MAX_UINT256, constants_1.MAX_UINT256);
            await (0, hardhat_network_helpers_1.setCode)(USDT_LENDING_POOL, (0, _src_1.getArtifact)('MockAaveLendingPool').deployedBytecode);
            const mockLendingPool = await (0, _src_1.instanceAt)('MockAaveLendingPool', USDT_LENDING_POOL);
            await mockLendingPool.setRevertType(2); // Type 2 is malicious swap query revert
            await (0, chai_1.expect)(rebalancer.rebalance(other.address)).to.be.revertedWith('BAL#357'); // MALICIOUS_QUERY_REVERT
        });
    });
    describe('read-only reentrancy protection', () => {
        let attacker;
        before('deploy attacker', async () => {
            attacker = await (0, _src_1.deploy)('ReadOnlyReentrancyAttackerAaveLP', [vault.address]);
        });
        async function performAttack(attackType, ethAmount, expectRevert) {
            // To trigger the callback and revert, send more than we need for the deposit
            // If we send just enough, there will be no "extra" ETH, and it won't trigger the callback and attack
            const amountToSend = expectRevert ? ethAmount.add(1) : ethAmount;
            const attack = attacker.startAttack(pool.address, attackType, ethAmount, { value: amountToSend });
            if (expectRevert) {
                await (0, chai_1.expect)(attack).to.be.revertedWith('BAL#420');
            }
            else {
                await (0, chai_1.expect)(attack).to.not.be.reverted;
            }
        }
        function itPerformsAttack(expectRevert) {
            const action = expectRevert ? 'triggers' : 'does not trigger';
            context('set targets', () => {
                it(`${action} the set targets attack`, async () => {
                    await performAttack(AttackType.SET_TARGETS, (0, numbers_1.fp)(1), expectRevert);
                });
            });
            context('set swap fee', () => {
                it(`${action} the set swap fee attack`, async () => {
                    await performAttack(AttackType.SET_SWAP_FEE, (0, numbers_1.fp)(1), expectRevert);
                });
            });
        }
        context('when exactly enough ETH is sent', () => {
            itPerformsAttack(false);
        });
        context('when too much ETH is sent', () => {
            itPerformsAttack(true);
        });
    });
});
