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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const sharedBeforeEach_1 = require("@helpers/sharedBeforeEach");
const constants_1 = require("@helpers/constants");
const numbers_1 = require("@helpers/numbers");
const encoder_1 = require("@helpers/models/pools/utils/encoder");
const encoder_2 = require("@helpers/models/pools/stable/encoder");
const types_1 = require("@helpers/models/types/types");
const actions_1 = require("@helpers/models/misc/actions");
const relativeError_1 = require("@helpers/relativeError");
const _src_5 = require("@src");
const utils_1 = require("ethers/lib/utils");
(0, _src_1.describeForkTest)('ComposableStablePool V4', 'mainnet', 16577000, function () {
    let task;
    let factory;
    let owner;
    let whale, auraWhale;
    let govMultisig;
    let vault;
    let authorizer;
    let busd, usdc, aura, graviAura;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    const USDC_SCALING = (0, numbers_1.bn)(1e12); // USDC has 6 decimals, so its scaling factor is 1e12
    const AURA_HOLDER = '0x2af2b2e485e1854fd71590c7ffd104db0f66f8a6';
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const BUSD = '0x4Fabb145d64652a948d72533023f6E7A623C7C53';
    const AURA = '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF';
    const GRAVIAURA = '0xBA485b556399123261a5F9c95d413B4f93107407';
    const tokens = [BUSD, USDC];
    const amplificationParameter = (0, numbers_1.bn)(400);
    const swapFeePercentage = (0, numbers_1.fp)(0.01);
    const initialBalanceBUSD = (0, numbers_1.fp)(1e6);
    const initialBalanceUSDC = (0, numbers_1.fp)(1e6).div(USDC_SCALING);
    const initialBalances = [initialBalanceBUSD, initialBalanceUSDC];
    // Pool deployed from previous factory version (GRAVI AURA - AURA)
    const GRAVI_AURA_POOL = '0x6A9603E481Fb8F2c09804ea9AdaB49A338855B90';
    let AttackType;
    (function (AttackType) {
        AttackType[AttackType["DISABLE_RECOVERY_MODE"] = 0] = "DISABLE_RECOVERY_MODE";
        AttackType[AttackType["UPDATE_PROTOCOL_FEE_CACHE"] = 1] = "UPDATE_PROTOCOL_FEE_CACHE";
        AttackType[AttackType["UPDATE_TOKEN_RATE_CACHE"] = 2] = "UPDATE_TOKEN_RATE_CACHE";
        AttackType[AttackType["SET_TOKEN_RATE_CACHE_DURATION"] = 3] = "SET_TOKEN_RATE_CACHE_DURATION";
    })(AttackType || (AttackType = {}));
    before('run task', async () => {
        task = new _src_2.Task('20230320-composable-stable-pool-v4', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('ComposableStablePoolFactory');
    });
    before('load signers', async () => {
        owner = await (0, _src_4.getSigner)();
        whale = await (0, _src_4.impersonate)(LARGE_TOKEN_HOLDER, (0, numbers_1.fp)(100));
        auraWhale = await (0, _src_4.impersonate)(AURA_HOLDER, (0, numbers_1.fp)(100));
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
    });
    before('load vault and tokens', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', await factory.getVault());
        authorizer = await new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        busd = await task.instanceAt('ERC20', BUSD);
        usdc = await task.instanceAt('ERC20', USDC);
        aura = await task.instanceAt('ERC20', AURA);
        graviAura = await task.instanceAt('ERC20', GRAVIAURA);
        await busd.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
    });
    async function createPool(tokens, rateProvider = constants_1.ZERO_ADDRESS, initialize = true, salt = '') {
        const rateProviders = Array(tokens.length).fill(rateProvider);
        const cacheDurations = Array(tokens.length).fill((0, numbers_1.bn)(0));
        const exemptFlags = Array(tokens.length).fill(false);
        const tx = await factory.create('CSP', 'CSBPT', tokens, amplificationParameter, rateProviders, cacheDurations, exemptFlags, swapFeePercentage, owner.address, salt == '' ? (0, utils_1.randomBytes)(32) : salt);
        const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
        const pool = await task.instanceAt('ComposableStablePool', event.args.pool);
        (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
        if (initialize) {
            const bptIndex = await pool.getBptIndex();
            const poolId = await pool.getPoolId();
            const registeredBalances = getRegisteredBalances(bptIndex, initialBalances);
            const { tokens: registeredTokens } = await vault.getPoolTokens(poolId);
            const userData = encoder_2.StablePoolEncoder.joinInit(registeredBalances);
            // Use this for maxAmountsIn
            registeredBalances[bptIndex] = constants_1.MAX_UINT256;
            await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                assets: registeredTokens,
                maxAmountsIn: registeredBalances,
                fromInternalBalance: false,
                userData,
            });
        }
        return pool;
    }
    function getRegisteredBalances(bptIndex, balances) {
        return Array.from({ length: balances.length + 1 }).map((_, i) => i == bptIndex ? (0, numbers_1.bn)(0) : i < bptIndex ? balances[i] : balances[i - 1]);
    }
    describe('getters', () => {
        it('check factory version', async () => {
            const expectedFactoryVersion = {
                name: 'ComposableStablePoolFactory',
                version: 4,
                deployment: '20230320-composable-stable-pool-v4',
            };
            (0, chai_1.expect)(await factory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
        it('check pool version', async () => {
            const pool = await createPool(tokens);
            const expectedPoolVersion = {
                name: 'ComposableStablePool',
                version: 4,
                deployment: '20230320-composable-stable-pool-v4',
            };
            (0, chai_1.expect)(await pool.version()).to.equal(JSON.stringify(expectedPoolVersion));
        });
    });
    describe('pool operations', () => {
        const amount = (0, numbers_1.fp)(500);
        let pool;
        let poolId;
        let bptIndex;
        context('swap', () => {
            before('deploy a composable stable pool', async () => {
                (0, chai_1.expect)(await factory.isPoolFromFactory(constants_1.ZERO_ADDRESS)).to.be.false;
                pool = await createPool(tokens);
                poolId = pool.getPoolId();
                const [registeredAddress] = await vault.getPool(poolId);
                (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
                bptIndex = await pool.getBptIndex();
            });
            it('performs a swap', async () => {
                await busd.connect(whale).transfer(owner.address, amount);
                await busd.connect(owner).approve(vault.address, amount);
                await vault
                    .connect(owner)
                    .swap({ kind: types_1.SwapKind.GivenIn, poolId, assetIn: BUSD, assetOut: USDC, amount, userData: '0x' }, { sender: owner.address, recipient: owner.address, fromInternalBalance: false, toInternalBalance: false }, 0, constants_1.MAX_UINT256);
                // Assert pool swap
                const expectedUSDC = amount.div(USDC_SCALING);
                (0, relativeError_1.expectEqualWithError)(await busd.balanceOf(owner.address), 0, 0.0001);
                (0, relativeError_1.expectEqualWithError)(await usdc.balanceOf(owner.address), (0, numbers_1.bn)(expectedUSDC), 0.1);
            });
        });
        context('proportional join', () => {
            before('deploy a composable stable pool', async () => {
                (0, chai_1.expect)(await factory.isPoolFromFactory(constants_1.ZERO_ADDRESS)).to.be.false;
                pool = await createPool(tokens);
                poolId = pool.getPoolId();
                const [registeredAddress] = await vault.getPool(poolId);
                (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
                bptIndex = await pool.getBptIndex();
            });
            it('joins proportionally', async () => {
                const ownerBptBalance = await pool.balanceOf(owner.address);
                const bptOut = ownerBptBalance.div(5);
                const { tokens: registeredTokens } = await vault.getPoolTokens(poolId);
                // Given the bptOut, the max amounts in should be slightly more than 1/5. Decimals make it a bit complicated.
                const adjustedBalances = [
                    initialBalanceBUSD.div((0, numbers_1.fp)(4.99)).mul((0, numbers_1.fp)(1)),
                    initialBalanceUSDC.div((0, numbers_1.bn)(4.99e6)).mul(1e6),
                ];
                const maxAmountsIn = getRegisteredBalances(bptIndex, adjustedBalances);
                const tx = await vault.connect(whale).joinPool(poolId, whale.address, whale.address, {
                    assets: registeredTokens,
                    maxAmountsIn: maxAmountsIn,
                    fromInternalBalance: false,
                    userData: encoder_2.StablePoolEncoder.joinAllTokensInForExactBptOut(bptOut),
                });
                const receipt = await (await tx).wait();
                const { deltas: amountsIn } = expectEvent.inReceipt(receipt, 'PoolBalanceChanged').args;
                // Amounts in should be ~ 1/5 the initial balances
                (0, chai_1.expect)(amountsIn).to.equalWithError(maxAmountsIn, 0.01);
                // Make sure received BPT is close to what we expect
                const currentBptBalance = await pool.balanceOf(whale.address);
                (0, chai_1.expect)(currentBptBalance).to.be.equalWithError(bptOut, 0.001);
            });
        });
        context('proportional exit', () => {
            before('deploy a composable stable pool', async () => {
                (0, chai_1.expect)(await factory.isPoolFromFactory(constants_1.ZERO_ADDRESS)).to.be.false;
                pool = await createPool(tokens);
                poolId = pool.getPoolId();
                const [registeredAddress] = await vault.getPool(poolId);
                (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
                bptIndex = await pool.getBptIndex();
            });
            it('exits proportionally', async () => {
                const previousBptBalance = await pool.balanceOf(owner.address);
                const bptIn = previousBptBalance.div(4);
                const { tokens: registeredTokens, balances: registeredBalances } = await vault.getPoolTokens(poolId);
                const tx = await vault.connect(owner).exitPool(poolId, owner.address, owner.address, {
                    assets: registeredTokens,
                    minAmountsOut: Array(registeredTokens.length).fill(0),
                    fromInternalBalance: false,
                    userData: encoder_2.StablePoolEncoder.exitExactBptInForTokensOut(bptIn),
                });
                const receipt = await (await tx).wait();
                const { deltas } = expectEvent.inReceipt(receipt, 'PoolBalanceChanged').args;
                const amountsOut = deltas.map((x) => x.mul(-1));
                const expectedAmountsOut = registeredBalances.map((b) => b.div(4));
                expectedAmountsOut[bptIndex] = (0, numbers_1.bn)(0);
                // Amounts out should be 1/4 the initial balances
                (0, chai_1.expect)(amountsOut).to.equalWithError(expectedAmountsOut, 0.00001);
                // Make sure sent BPT is close to what we expect
                const currentBptBalance = await pool.balanceOf(owner.address);
                (0, chai_1.expect)(currentBptBalance).to.be.equalWithError((0, numbers_1.bn)(previousBptBalance).sub(bptIn), 0.001);
            });
        });
    });
    describe('read-only reentrancy protection', () => {
        let pool;
        let poolId;
        let attacker;
        // Actual amounts do not matter for the attack, so we pick an arbitrary value that the whale can transfer.
        // The same amount will actually represent different quantities since the decimals may vary from token to token,
        // but this is fine since we only need a valid join.
        const attackerFunds = 1000;
        (0, sharedBeforeEach_1.sharedBeforeEach)('deploy and fund attacker', async () => {
            attacker = await (0, _src_5.deploy)('ReadOnlyReentrancyAttackerCSP', [vault.address]);
            await busd.connect(whale).transfer(attacker.address, attackerFunds);
            await usdc.connect(whale).transfer(attacker.address, attackerFunds);
            await aura.connect(auraWhale).transfer(attacker.address, attackerFunds);
            await graviAura.connect(auraWhale).transfer(attacker.address, attackerFunds);
        });
        context('when the target pool is not protected', () => {
            (0, sharedBeforeEach_1.sharedBeforeEach)('get affected pool instance', async () => {
                pool = await task.instanceAt('ComposableStablePool', GRAVI_AURA_POOL);
                poolId = await pool.getPoolId();
            });
            itPerformsAttack(false);
        });
        context('when the target pool is protected', () => {
            (0, sharedBeforeEach_1.sharedBeforeEach)('deploy pool with rate providers', async () => {
                const rateProvider = await (0, _src_5.deploy)('MockRateProvider');
                pool = await createPool(tokens, rateProvider.address);
                poolId = await pool.getPoolId();
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
            context('update token rate cache', () => {
                it(`${action} token rate cache attack`, async () => {
                    await performAttack(AttackType.UPDATE_TOKEN_RATE_CACHE, expectRevert);
                });
            });
            context('update token rate cache duration', () => {
                (0, sharedBeforeEach_1.sharedBeforeEach)('grant permissions to attacker', async () => {
                    await authorizer
                        .connect(govMultisig)
                        .grantRole(await (0, actions_1.actionId)(pool, 'setTokenRateCacheDuration'), attacker.address);
                });
                it(`${action} token rate cache duration attack`, async () => {
                    await performAttack(AttackType.SET_TOKEN_RATE_CACHE_DURATION, expectRevert);
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
            const allTokens = (await vault.getPoolTokens(poolId)).tokens;
            // Amounts in must not include BPT in user data.
            const userData = encoder_2.StablePoolEncoder.joinExactTokensInForBPTOut(Array(allTokens.length - 1).fill(attackerFunds), 0);
            // We are doing exact tokens in, so max amounts are not relevant.
            const joinRequest = {
                assets: allTokens,
                maxAmountsIn: Array(allTokens.length).fill(constants_1.MAX_UINT256),
                userData,
                fromInternalBalance: false,
            };
            if (expectRevert) {
                await (0, chai_1.expect)(attacker.startAttack(poolId, joinRequest, attackType, { value: 10 })).to.be.revertedWith('BAL#420');
            }
            else {
                await attacker.startAttack(poolId, joinRequest, attackType, { value: 10 });
            }
        }
    });
    describe('recovery mode', () => {
        let pool;
        let poolId;
        before('deploy and initialize a composable stable pool', async () => {
            pool = await createPool(tokens);
            poolId = await pool.getPoolId();
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
            const { tokens: registeredTokens } = await vault.getPoolTokens(poolId);
            const userData = encoder_1.BasePoolEncoder.recoveryModeExit(bptBalance);
            await vault.connect(owner).exitPool(poolId, owner.address, owner.address, {
                assets: registeredTokens,
                minAmountsOut: Array(registeredTokens.length).fill(0),
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
    describe('create2 functionality', () => {
        it('can be deployed with a different salt', async () => {
            const pool = await createPool(tokens, constants_1.ZERO_ADDRESS, false, constants_1.ZERO_BYTES32);
            const pool2 = await createPool(tokens, constants_1.ZERO_ADDRESS, false, constants_1.ONES_BYTES32);
            (0, chai_1.expect)(pool2.address).to.not.equal(pool.address);
        });
    });
    describe('factory disable', () => {
        it('the factory can be disabled', async () => {
            await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(factory, 'disable'), govMultisig.address);
            await factory.connect(govMultisig).disable();
            (0, chai_1.expect)(await factory.isDisabled()).to.be.true;
            await (0, chai_1.expect)(factory.create('CSP', 'CSBPT', tokens, amplificationParameter, Array(tokens.length).fill(constants_1.ZERO_ADDRESS), Array(tokens.length).fill(0), Array(tokens.length).fill(false), swapFeePercentage, owner.address, constants_1.ZERO_BYTES32)).to.be.revertedWith('BAL#211');
        });
    });
});
