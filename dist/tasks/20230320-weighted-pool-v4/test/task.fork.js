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
const ethers_1 = require("ethers");
const sharedBeforeEach_1 = require("@helpers/sharedBeforeEach");
const encoder_1 = require("@helpers/models/pools/utils/encoder");
const encoder_2 = require("@helpers/models/pools/weighted/encoder");
const types_1 = require("@helpers/models/types/types");
const normalizedWeights_1 = require("@helpers/models/pools/weighted/normalizedWeights");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const relativeError_1 = require("@helpers/relativeError");
const actions_1 = require("@helpers/models/misc/actions");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const _src_2 = require("@src");
const utils_1 = require("ethers/lib/utils");
(0, _src_2.describeForkTest)('WeightedPool V4', 'mainnet', 16870763, function () {
    let owner, whale, wstEthWhale, govMultisig;
    let factory, vault, authorizer, uni, comp, aave, wstEth, math;
    let task;
    const COMP = '0xc00e94cb662c3520282e6f5717214004a7f26888';
    const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
    const AAVE = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
    const WSTETH = '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0';
    const tokens = [UNI, AAVE, COMP];
    const initialBalanceCOMP = (0, numbers_1.fp)(1e4);
    const initialBalanceUNI = (0, numbers_1.fp)(1e5);
    const initialBalanceAAVE = (0, numbers_1.fp)(1e4);
    const initialBalances = [initialBalanceUNI, initialBalanceAAVE, initialBalanceCOMP];
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    const WSTETH_TOKEN_HOLDER = '0x4b5a787ac6921cdefc57d8823ebd4d211f8e0519';
    const NAME = 'Balancer Pool Token';
    const SYMBOL = 'BPT';
    const POOL_SWAP_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01);
    const WEIGHTS = (0, normalizedWeights_1.toNormalizedWeights)([(0, numbers_1.fp)(20), (0, numbers_1.fp)(30), (0, numbers_1.fp)(50)]);
    const COMP_WSTETH_WEIGHTED_POOL_V2 = '0x496ff26B76b8d23bbc6cF1Df1eeE4a48795490F7';
    let AttackType;
    (function (AttackType) {
        AttackType[AttackType["DISABLE_RECOVERY_MODE"] = 0] = "DISABLE_RECOVERY_MODE";
        AttackType[AttackType["UPDATE_PROTOCOL_FEE_CACHE"] = 1] = "UPDATE_PROTOCOL_FEE_CACHE";
    })(AttackType || (AttackType = {}));
    before('run task', async () => {
        task = new _src_2.Task('20230320-weighted-pool-v4', _src_2.TaskMode.TEST, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('WeightedPoolFactory');
    });
    before('load signers', async () => {
        owner = await (0, _src_2.getSigner)();
        whale = await (0, _src_2.impersonate)(LARGE_TOKEN_HOLDER);
        wstEthWhale = await (0, _src_2.impersonate)(WSTETH_TOKEN_HOLDER);
        govMultisig = await (0, _src_2.impersonate)(GOV_MULTISIG);
    });
    before('setup contracts', async () => {
        vault = await new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        authorizer = await new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        const managedPoolTask = await new _src_2.Task('20221021-managed-pool', _src_2.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        const managedPoolFactory = await managedPoolTask.deployedInstance('ManagedPoolFactory');
        math = await managedPoolTask.instanceAt('ExternalWeightedMath', await managedPoolFactory.getWeightedMath());
        comp = await task.instanceAt('IERC20', COMP);
        uni = await task.instanceAt('IERC20', UNI);
        aave = await task.instanceAt('IERC20', AAVE);
        wstEth = await task.instanceAt('IERC20', WSTETH);
    });
    async function createPool(salt = '') {
        const receipt = await (await factory.create(NAME, SYMBOL, tokens, WEIGHTS, [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS], POOL_SWAP_FEE_PERCENTAGE, owner.address, salt == '' ? (0, utils_1.randomBytes)(32) : salt)).wait();
        const event = expectEvent.inReceipt(receipt, 'PoolCreated');
        return task.instanceAt('WeightedPool', event.args.pool);
    }
    async function initPool(poolId) {
        await comp.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await uni.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await aave.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        const userData = encoder_2.WeightedPoolEncoder.joinInit(initialBalances);
        await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
            assets: tokens,
            maxAmountsIn: initialBalances,
            fromInternalBalance: false,
            userData,
        });
    }
    describe('getters', () => {
        it('check factory version', async () => {
            const expectedFactoryVersion = {
                name: 'WeightedPoolFactory',
                version: 4,
                deployment: '20230320-weighted-pool-v4',
            };
            (0, chai_1.expect)(await factory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
        it('check pool version', async () => {
            const pool = await createPool();
            const expectedPoolVersion = {
                name: 'WeightedPool',
                version: 4,
                deployment: '20230320-weighted-pool-v4',
            };
            (0, chai_1.expect)(await pool.version()).to.equal(JSON.stringify(expectedPoolVersion));
        });
    });
    describe('create and swap', () => {
        let pool;
        let poolId;
        it('deploy a weighted pool', async () => {
            pool = await createPool();
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
        });
        it('initialize the pool', async () => {
            await initPool(poolId);
            const { balances } = await vault.getPoolTokens(poolId);
            (0, chai_1.expect)(balances).to.deep.equal(initialBalances);
        });
        it('swap in the pool', async () => {
            const amount = (0, numbers_1.fp)(500);
            await comp.connect(whale).transfer(owner.address, amount);
            await comp.connect(owner).approve(vault.address, amount);
            await vault
                .connect(owner)
                .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: COMP, assetOut: UNI, amount, userData: '0x' }, { sender: owner.address, recipient: owner.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
            // Assert pool swap
            const expectedUNI = await math.calcOutGivenIn(initialBalanceCOMP, WEIGHTS[tokens.indexOf(COMP)], initialBalanceUNI, WEIGHTS[tokens.indexOf(UNI)], amount);
            (0, relativeError_1.expectEqualWithError)(await comp.balanceOf(owner.address), 0, 0.0001);
            (0, relativeError_1.expectEqualWithError)(await uni.balanceOf(owner.address), expectedUNI, 0.1);
        });
    });
    describe('read-only reentrancy protection', () => {
        let pool;
        let poolId;
        let attacker;
        const attackerFunds = (0, numbers_1.fp)(1);
        (0, sharedBeforeEach_1.sharedBeforeEach)('deploy and fund attacker', async () => {
            attacker = await (0, _src_1.deploy)('ReadOnlyReentrancyAttackerWP', [vault.address]);
            await comp.connect(whale).transfer(attacker.address, attackerFunds);
            await uni.connect(whale).transfer(attacker.address, attackerFunds);
            await aave.connect(whale).transfer(attacker.address, attackerFunds);
            await wstEth.connect(wstEthWhale).transfer(attacker.address, attackerFunds);
        });
        context('when the target pool is not protected', () => {
            (0, sharedBeforeEach_1.sharedBeforeEach)('get affected pool instance', async () => {
                pool = await task.instanceAt('WeightedPool', COMP_WSTETH_WEIGHTED_POOL_V2);
                poolId = await pool.getPoolId();
            });
            itPerformsAttack(false);
        });
        context('when the target pool is protected', () => {
            (0, sharedBeforeEach_1.sharedBeforeEach)('deploy pool and attacker', async () => {
                pool = await createPool();
                poolId = await pool.getPoolId();
                await initPool(poolId);
            });
            itPerformsAttack(true);
        });
        function itPerformsAttack(expectRevert) {
            const action = expectRevert ? 'rejects' : 'does not reject';
            context('update protocol fee cache', () => {
                it(`${action} protocol fee cache attack`, async () => {
                    await performAttack(AttackType.UPDATE_PROTOCOL_FEE_CACHE, expectRevert);
                });
            });
            context('disable recovery mode', () => {
                (0, sharedBeforeEach_1.sharedBeforeEach)('grant permissions to attacker', async () => {
                    await authorizer
                        .connect(govMultisig)
                        .grantRole(await (0, actions_1.actionId)(pool, 'disableRecoveryMode'), attacker.address);
                });
                it(`${action} disable recovery mode attack`, async () => {
                    await performAttack(AttackType.DISABLE_RECOVERY_MODE, expectRevert);
                });
            });
        }
        async function performAttack(attackType, expectRevert) {
            const attackTokens = (await vault.getPoolTokens(poolId)).tokens;
            const joinRequest = {
                assets: attackTokens,
                maxAmountsIn: Array(attackTokens.length).fill(constants_1.MAX_UINT256),
                userData: encoder_2.WeightedPoolEncoder.joinExactTokensInForBPTOut(Array(attackTokens.length).fill(attackerFunds), 0),
                fromInternalBalance: false,
            };
            const attack = attacker.startAttack(poolId, joinRequest, attackType, { value: 10 });
            if (expectRevert) {
                await (0, chai_1.expect)(attack).to.be.revertedWith('BAL#420');
            }
            else {
                await (0, chai_1.expect)(attack).to.not.be.reverted;
            }
        }
    });
    describe('recovery mode', () => {
        let pool;
        let poolId;
        before('deploy and initialize a weighted pool', async () => {
            pool = await createPool();
            poolId = await pool.getPoolId();
            await comp.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await uni.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await aave.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            const userData = encoder_2.WeightedPoolEncoder.joinInit(initialBalances);
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
            const vaultUNIBalanceBeforeExit = await uni.balanceOf(vault.address);
            const ownerUNIBalanceBeforeExit = await uni.balanceOf(owner.address);
            const userData = encoder_1.BasePoolEncoder.recoveryModeExit(bptBalance);
            await vault.connect(owner).exitPool(poolId, owner.address, owner.address, {
                assets: tokens,
                minAmountsOut: Array(tokens.length).fill(0),
                fromInternalBalance: false,
                userData,
            });
            const remainingBalance = await pool.balanceOf(owner.address);
            (0, chai_1.expect)(remainingBalance).to.equal(0);
            const vaultUNIBalanceAfterExit = await uni.balanceOf(vault.address);
            const ownerUNIBalanceAfterExit = await uni.balanceOf(owner.address);
            (0, chai_1.expect)(vaultUNIBalanceAfterExit).to.lt(vaultUNIBalanceBeforeExit);
            (0, chai_1.expect)(ownerUNIBalanceAfterExit).to.gt(ownerUNIBalanceBeforeExit);
        });
    });
    describe('create2 functionality', () => {
        it('can be deployed with a different salt', async () => {
            const pool = await createPool(constants_1.ZERO_BYTES32);
            const pool2 = await createPool(constants_1.ONES_BYTES32);
            (0, chai_1.expect)(pool2.address).to.not.equal(pool.address);
        });
    });
    it('cannot execute the contract halves', async () => {
        const { contractA, contractB } = await factory.getCreationCodeContracts();
        const txA = {
            to: contractA,
            value: ethers_1.ethers.utils.parseEther('0.001'),
        };
        const txB = {
            to: contractB,
            value: ethers_1.ethers.utils.parseEther('0.001'),
        };
        await (0, chai_1.expect)(owner.sendTransaction(txA)).to.be.reverted;
        await (0, chai_1.expect)(owner.sendTransaction(txB)).to.be.reverted;
    });
    describe('factory disable', () => {
        it('the factory can be disabled', async () => {
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(factory, 'disable'), govMultisig.address);
            await factory.connect(govMultisig).disable();
            (0, chai_1.expect)(await factory.isDisabled()).to.be.true;
            await (0, chai_1.expect)(factory
                .connect(owner)
                .create(NAME, SYMBOL, tokens, WEIGHTS, [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS], POOL_SWAP_FEE_PERCENTAGE, owner.address, (0, utils_1.randomBytes)(32))).to.be.revertedWith('BAL#211');
        });
    });
});
