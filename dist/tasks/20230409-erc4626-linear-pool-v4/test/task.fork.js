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
const utils_1 = require("ethers/lib/utils");
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
var SwapKind;
(function (SwapKind) {
    SwapKind[SwapKind["GivenIn"] = 0] = "GivenIn";
    SwapKind[SwapKind["GivenOut"] = 1] = "GivenOut";
})(SwapKind = exports.SwapKind || (exports.SwapKind = {}));
(0, _src_2.describeForkTest)('ERC4626LinearPoolFactory', 'mainnet', 16550500, function () {
    let owner, holder, other;
    let govMultisig;
    let vault, authorizer, mainToken;
    let factory;
    let rebalancer;
    let task;
    const frxEth = '0x5E8422345238F34275888049021821E8E08CAa1f';
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const erc4626Token = '0xac3e018457b222d93114458476f3e3416abbe38f';
    const WETH_SCALING = (0, numbers_1.bn)(1); // WETH has 18 decimals, so its scaling factor is 1
    const FRXETH_SCALING = (0, numbers_1.bn)(1); // frxEth has 18 decimals, so its scaling factor is 1
    const WETH_HOLDER = '0xF04a5cC80B1E94C69B48f5ee68a08CD2F09A7c3E';
    const FRXETH_HOLDER = '0xa1f8a6807c402e4a15ef4eba36528a3fed24e577';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const SWAP_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01); // 1%
    // The targets are set using 18 decimals, even if the token has fewer (as is the case for USDC);
    const INITIAL_UPPER_TARGET = (0, numbers_1.fp)(1e2);
    // The initial midpoint (upper target / 2) must be between the final lower and upper targets
    const FINAL_LOWER_TARGET = (0, numbers_1.fp)(0.2e2);
    const FINAL_UPPER_TARGET = (0, numbers_1.fp)(5e2);
    const POOL_VERSION = 4;
    const TASK_NAME = '20230409-erc4626-linear-pool-v4';
    const PROTOCOL_ID = 0;
    const SALT = (0, utils_1.randomBytes)(32);
    let AttackType;
    (function (AttackType) {
        AttackType[AttackType["SET_TARGETS"] = 0] = "SET_TARGETS";
        AttackType[AttackType["SET_SWAP_FEE"] = 1] = "SET_SWAP_FEE";
    })(AttackType || (AttackType = {}));
    let pool;
    let poolId;
    before('run task', async () => {
        task = new _src_1.Task(TASK_NAME, _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('ERC4626LinearPoolFactory');
    });
    before('load signers', async () => {
        [, owner, other] = await (0, _src_1.getSigners)();
        holder = await (0, _src_1.impersonate)(FRXETH_HOLDER, (0, numbers_1.fp)(100));
        govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        mainToken = await task.instanceAt('IERC20', frxEth);
        await mainToken.connect(holder).approve(vault.address, constants_1.MAX_UINT256);
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
            const { cash } = await vault.getPoolTokenInfo(poolId, frxEth);
            const scaledCash = cash.mul(FRXETH_SCALING);
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
            const initialRecipientMainBalance = await mainToken.balanceOf(other.address);
            if (expectedState != LinearPoolState.BALANCED) {
                await rebalancer.connect(holder).rebalance(other.address);
            }
            else {
                await rebalancer.connect(holder).rebalanceWithExtraMain(other.address, 5);
            }
            const finalRecipientMainBalance = await mainToken.balanceOf(other.address);
            if (fees > 0) {
                // The recipient of the rebalance call should get the fees that were collected (though there's some rounding
                // error in the main-wrapped conversion).
                (0, chai_1.expect)(finalRecipientMainBalance.sub(initialRecipientMainBalance)).to.be.almostEqual(fees.div(FRXETH_SCALING), 0.00000001);
            }
            else {
                // The recipient of the rebalance call will get any extra main tokens that were not utilized.
                (0, chai_1.expect)(finalRecipientMainBalance).to.be.almostEqual(initialRecipientMainBalance, 0.00000001);
            }
            const mainInfo = await vault.getPoolTokenInfo(poolId, frxEth);
            const expectedMainBalance = lowerTarget.add(upperTarget).div(2);
            (0, chai_1.expect)(mainInfo.cash.mul(FRXETH_SCALING)).to.equal(expectedMainBalance);
            (0, chai_1.expect)(mainInfo.managed).to.equal(0);
        });
    }
    describe('create and check getters', () => {
        it('deploy a linear pool', async () => {
            const tx = await factory.create('', '', frxEth, erc4626Token, INITIAL_UPPER_TARGET, SWAP_FEE_PERCENTAGE, owner.address, PROTOCOL_ID, SALT);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            pool = await task.instanceAt('ERC4626LinearPool', event.args.pool);
            (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
            const { assetManager } = await vault.getPoolTokenInfo(poolId, frxEth); // We could query for either frxEth or erc4626Token
            rebalancer = await task.instanceAt('ERC4626LinearPoolRebalancer', assetManager);
        });
        it('check factory version', async () => {
            const expectedFactoryVersion = {
                name: 'ERC4626LinearPoolFactory',
                version: POOL_VERSION,
                deployment: TASK_NAME,
            };
            (0, chai_1.expect)(await factory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
        it('check pool version', async () => {
            const expectedPoolVersion = {
                name: 'ERC4626LinearPool',
                version: POOL_VERSION,
                deployment: TASK_NAME,
            };
            (0, chai_1.expect)(await pool.version()).to.equal(JSON.stringify(expectedPoolVersion));
        });
    });
    describe('join, and rebalance', () => {
        it('join the pool', async () => {
            // We're going to join with enough main token to bring the Pool above its upper target, which will let us later
            // rebalance.
            const joinAmount = INITIAL_UPPER_TARGET.mul(2).div(FRXETH_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: frxEth,
                assetOut: pool.address,
                amount: joinAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
            // Assert join amount - some fees will be collected as we're going over the upper target.
            const excess = joinAmount.mul(FRXETH_SCALING).sub(INITIAL_UPPER_TARGET);
            const joinCollectedFees = excess.mul(SWAP_FEE_PERCENTAGE).div(numbers_1.FP_ONE);
            const expectedBPT = joinAmount.mul(FRXETH_SCALING).sub(joinCollectedFees);
            (0, chai_1.expect)(await pool.balanceOf(holder.address)).to.equal(expectedBPT);
        });
        itRebalancesThePool(LinearPoolState.MAIN_EXCESS);
        it('set final targets', async () => {
            await (0, chai_1.expect)(pool.connect(owner).setTargets(FINAL_LOWER_TARGET, FINAL_UPPER_TARGET)).to.not.be.reverted;
        });
    });
    describe('generate excess of main token and rebalance', () => {
        before('approve the rebalancer', async () => {
            await mainToken.connect(holder).approve(rebalancer.address, constants_1.MAX_UINT256); // To send extra main on rebalance
        });
        it('deposit main tokens', async () => {
            // We're going to join with enough main token to bring the Pool above its upper target, which will let us later
            // rebalance.
            const { upperTarget } = await pool.getTargets();
            const joinAmount = upperTarget.mul(5).div(FRXETH_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: frxEth,
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
            const { cash } = await vault.getPoolTokenInfo(poolId, frxEth);
            const scaledCash = cash.mul(FRXETH_SCALING);
            const { lowerTarget } = await pool.getTargets();
            const exitAmount = scaledCash.sub(lowerTarget.div(3)).div(FRXETH_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: frxEth,
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
            const joinAmount = midpoint.div(100).div(FRXETH_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: frxEth,
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
            const exitAmount = midpoint.div(100).div(FRXETH_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: frxEth,
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
    describe('read-only reentrancy protection', () => {
        let wethPool;
        let wethHolder;
        let poolId;
        let attacker;
        before('use WETH', async () => {
            wethHolder = await (0, _src_1.impersonate)(WETH_HOLDER, (0, numbers_1.fp)(100));
            const weth = await (0, _src_3.instanceAt)('IERC20', WETH);
            await weth.connect(wethHolder).approve(vault.address, constants_1.MAX_UINT256);
        });
        before('deploy attacker', async () => {
            attacker = await (0, _src_3.deploy)('ReadOnlyReentrancyAttackerLP', [vault.address]);
        });
        before('deploy pool and prepare', async () => {
            const tx = await factory.create('', '', WETH, erc4626Token, INITIAL_UPPER_TARGET, SWAP_FEE_PERCENTAGE, owner.address, PROTOCOL_ID, SALT);
            const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
            wethPool = await task.instanceAt('ERC4626LinearPool', event.args.pool);
            poolId = await wethPool.getPoolId();
            const joinAmount = INITIAL_UPPER_TARGET.div(2).div(WETH_SCALING);
            await vault.connect(wethHolder).swap({
                kind: SwapKind.GivenIn,
                poolId,
                assetIn: WETH,
                assetOut: wethPool.address,
                amount: joinAmount,
                userData: '0x',
            }, {
                sender: wethHolder.address,
                recipient: wethHolder.address,
                fromInternalBalance: false,
                toInternalBalance: false,
            }, 0, constants_1.MAX_UINT256);
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(wethPool, 'enableRecoveryMode'), other.address);
            // The functions to attack are permissioned, so the attacker needs permissions before starting.
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(wethPool, 'setTargets'), attacker.address);
            await authorizer
                .connect(govMultisig)
                .grantRole(await (0, actions_1.actionId)(wethPool, 'setSwapFeePercentage'), attacker.address);
            await wethPool.connect(other).enableRecoveryMode();
            const bptBalance = await wethPool.balanceOf(wethHolder.address);
            await wethPool.connect(wethHolder).transfer(attacker.address, bptBalance);
        });
        async function performAttack(attackType) {
            // Any BPT amount works as long as the attacker has the funds.
            const attack = attacker.startAttack(wethPool.address, attackType, await wethPool.balanceOf(attacker.address));
            await (0, chai_1.expect)(attack).to.be.revertedWith('BAL#420');
        }
        context('set targets', () => {
            it(`performs the set targets attack`, async () => {
                await performAttack(AttackType.SET_TARGETS);
            });
        });
        context('set swap fee', () => {
            it(`performs the set swap fee attack`, async () => {
                await performAttack(AttackType.SET_SWAP_FEE);
            });
        });
    });
    describe('rebalancer query protection', async () => {
        it('reverts with a malicious lending pool', async () => {
            const { cash } = await vault.getPoolTokenInfo(poolId, frxEth);
            const scaledCash = cash.mul(FRXETH_SCALING);
            const { lowerTarget } = await pool.getTargets();
            const exitAmount = scaledCash.sub(lowerTarget.div(3)).div(FRXETH_SCALING);
            await vault.connect(holder).swap({
                kind: SwapKind.GivenOut,
                poolId,
                assetIn: pool.address,
                assetOut: frxEth,
                amount: exitAmount,
                userData: '0x',
            }, { sender: holder.address, recipient: holder.address, fromInternalBalance: false, toInternalBalance: false }, constants_1.MAX_UINT256, constants_1.MAX_UINT256);
            await (0, hardhat_network_helpers_1.setCode)(erc4626Token, (0, _src_3.getArtifact)('MockERC4626Token').deployedBytecode);
            const mockLendingPool = await (0, _src_3.instanceAt)('MockERC4626Token', erc4626Token);
            await mockLendingPool.setRevertType(2); // Type 2 is malicious swap query revert
            await (0, chai_1.expect)(rebalancer.rebalance(other.address)).to.be.revertedWith('BAL#357'); // MALICIOUS_QUERY_REVERT
        });
    });
});
