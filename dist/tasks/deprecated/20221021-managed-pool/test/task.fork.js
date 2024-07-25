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
const encoder_2 = require("@helpers/models/pools/weighted/encoder");
const types_1 = require("@helpers/models/types/types");
const normalizedWeights_1 = require("@helpers/models/pools/weighted/normalizedWeights");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const relativeError_1 = require("@helpers/relativeError");
const actions_1 = require("@helpers/models/misc/actions");
const constants_1 = require("@helpers/constants");
const types_2 = require("@helpers/models/types/types");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('ManagedPoolFactory', 'mainnet', 15634000, function () {
    let owner, whale, govMultisig;
    let factory, vault, authorizer, uni, comp, aave, math;
    let task;
    const COMP = '0xc00e94cb662c3520282e6f5717214004a7f26888';
    const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
    const AAVE = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
    const tokens = [UNI, AAVE, COMP];
    const initialBalanceCOMP = (0, numbers_1.fp)(1e4);
    const initialBalanceUNI = (0, numbers_1.fp)(1e5);
    const initialBalanceAAVE = (0, numbers_1.fp)(1e4);
    const initialBalances = [initialBalanceUNI, initialBalanceAAVE, initialBalanceCOMP];
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    const NAME = 'Balancer Pool Token';
    const SYMBOL = 'BPT';
    const POOL_SWAP_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01);
    const POOL_MANAGEMENT_AUM_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01);
    const WEIGHTS = (0, normalizedWeights_1.toNormalizedWeights)([(0, numbers_1.fp)(20), (0, numbers_1.fp)(30), (0, numbers_1.fp)(50)]);
    before('run task', async () => {
        task = new _src_1.Task('20221021-managed-pool', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('ManagedPoolFactory');
        math = await task.instanceAt('ExternalWeightedMath', await factory.getWeightedMath());
    });
    before('load signers', async () => {
        owner = await (0, _src_1.getSigner)();
        whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
        govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        comp = await task.instanceAt('IERC20', COMP);
        uni = await task.instanceAt('IERC20', UNI);
        aave = await task.instanceAt('IERC20', AAVE);
    });
    async function createPool(swapEnabled = true, mustAllowlistLPs = false) {
        const assetManagers = Array(tokens.length).fill(constants_1.ZERO_ADDRESS);
        assetManagers[0] = owner.address;
        const newPoolParams = {
            name: NAME,
            symbol: SYMBOL,
            tokens: tokens,
            normalizedWeights: WEIGHTS,
            assetManagers: assetManagers,
            swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
            swapEnabledOnStart: swapEnabled,
            mustAllowlistLPs: mustAllowlistLPs,
            managementAumFeePercentage: POOL_MANAGEMENT_AUM_FEE_PERCENTAGE,
            aumFeeId: types_2.ProtocolFee.AUM,
        };
        const receipt = await (await factory.connect(owner).create(newPoolParams, owner.address)).wait();
        const event = expectEvent.inReceipt(receipt, 'PoolCreated');
        return task.instanceAt('ManagedPool', event.args.pool);
    }
    describe('create and swap', () => {
        let pool;
        let poolId;
        it('deploy a managed pool', async () => {
            pool = await createPool();
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
        });
        it('initialize the pool', async () => {
            await comp.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await uni.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await aave.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            const userData = encoder_2.WeightedPoolEncoder.joinInit(initialBalances);
            // This is a composable pool, so assets array has to contain BPT.
            await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                assets: [pool.address, ...tokens],
                maxAmountsIn: [constants_1.MAX_UINT256, ...initialBalances],
                fromInternalBalance: false,
                userData,
            });
            const { balances } = await vault.getPoolTokens(poolId);
            const totalSupply = await pool.totalSupply();
            const ownerBpt = await pool.balanceOf(owner.address);
            const minBpt = await pool.balanceOf(constants_1.ZERO_ADDRESS);
            (0, chai_1.expect)(balances).to.deep.equal([totalSupply.sub(ownerBpt).sub(minBpt), ...initialBalances]);
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
    describe('recovery mode', () => {
        let pool;
        let poolId;
        before('deploy and initialize a stable pool', async () => {
            pool = await createPool();
            poolId = await pool.getPoolId();
            await comp.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await uni.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await aave.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            const userData = encoder_2.WeightedPoolEncoder.joinInit(initialBalances);
            // This is a composable pool, so assets array has to contain BPT.
            await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                assets: [pool.address, ...tokens],
                maxAmountsIn: [constants_1.MAX_UINT256, ...initialBalances],
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
            const tokensWithBpt = [pool.address, ...tokens];
            await vault.connect(owner).exitPool(poolId, owner.address, owner.address, {
                assets: tokensWithBpt,
                minAmountsOut: Array(tokensWithBpt.length).fill(0),
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
    describe('factory disable', () => {
        it('the factory can be disabled', async () => {
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(factory, 'disable'), govMultisig.address);
            await factory.connect(govMultisig).disable();
            (0, chai_1.expect)(await factory.isDisabled()).to.be.true;
            const newPoolParams = {
                name: NAME,
                symbol: SYMBOL,
                tokens: tokens,
                normalizedWeights: WEIGHTS,
                assetManagers: Array(tokens.length).fill(constants_1.ZERO_ADDRESS),
                swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
                swapEnabledOnStart: true,
                mustAllowlistLPs: true,
                managementAumFeePercentage: POOL_MANAGEMENT_AUM_FEE_PERCENTAGE,
                aumFeeId: types_2.ProtocolFee.AUM,
            };
            await (0, chai_1.expect)(factory.connect(owner).create(newPoolParams, owner.address)).to.be.revertedWith('BAL#211');
        });
    });
});
