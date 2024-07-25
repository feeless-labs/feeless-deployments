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
const constants_1 = require("@helpers/constants");
const abi_coder_1 = require("@ethersproject/abi/lib/abi-coder");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const sharedStableParams_1 = require("./helpers/sharedStableParams");
(0, _src_1.describeForkTest)('BatchRelayerLibrary - Legacy Stable', 'mainnet', 14860000, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    before('run task', async () => {
        task = new _src_1.Task('20230314-batch-relayer-v5', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load vault and authorizer', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    describe('original stable pools', () => {
        const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
        let LegacyStablePoolExitKind;
        (function (LegacyStablePoolExitKind) {
            LegacyStablePoolExitKind[LegacyStablePoolExitKind["EXACT_BPT_IN_FOR_ONE_TOKEN_OUT"] = 0] = "EXACT_BPT_IN_FOR_ONE_TOKEN_OUT";
            LegacyStablePoolExitKind[LegacyStablePoolExitKind["EXACT_BPT_IN_FOR_TOKENS_OUT"] = 1] = "EXACT_BPT_IN_FOR_TOKENS_OUT";
            LegacyStablePoolExitKind[LegacyStablePoolExitKind["BPT_IN_FOR_EXACT_TOKENS_OUT"] = 2] = "BPT_IN_FOR_EXACT_TOKENS_OUT";
        })(LegacyStablePoolExitKind || (LegacyStablePoolExitKind = {}));
        let owner, whale;
        let pool, factory;
        let usdc, dai;
        let poolId;
        let stableTask;
        before('get signers', async () => {
            owner = await (0, _src_1.getSigner)();
            whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
        });
        before('approve relayer at the authorizer', async () => {
            const relayerActionIds = await Promise.all(['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) => vault.getActionId(vault.interface.getSighash(action))));
            // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
            // such an account exists.
            const admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));
            // Grant relayer permission to call all relayer functions
            await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
        });
        before('approve relayer by the user', async () => {
            await vault.connect(owner).setRelayerApproval(owner.address, relayer.address, true);
        });
        before('load tokens and approve', async () => {
            dai = await task.instanceAt('IERC20', sharedStableParams_1.DAI);
            usdc = await task.instanceAt('IERC20', sharedStableParams_1.USDC);
            await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
            await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        });
        context('stable pool', () => {
            before('run original stable task', async () => {
                stableTask = new _src_1.Task('20210624-stable-pool', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
                factory = await stableTask.deployedInstance('StablePoolFactory');
            });
            before('deploy stable pool', async () => {
                const tx = await factory.create('SP', 'SPT', sharedStableParams_1.tokens, sharedStableParams_1.amplificationParameter, sharedStableParams_1.swapFeePercentage, owner.address);
                const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
                pool = await stableTask.instanceAt('StablePool', event.args.pool);
                (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
                poolId = await pool.getPoolId();
                const [registeredAddress] = await vault.getPool(poolId);
                (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
            });
            before('initialize stable pool', async () => {
                const userData = encoder_1.StablePoolEncoder.joinInit(sharedStableParams_1.initialBalances);
                await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                    assets: sharedStableParams_1.tokens,
                    maxAmountsIn: sharedStableParams_1.initialBalances,
                    fromInternalBalance: false,
                    userData,
                });
            });
            it('can exit proportionally through the relayer', async () => {
                const bptBalance = await pool.balanceOf(owner.address);
                (0, chai_1.expect)(bptBalance).to.gt(0);
                const vaultDAIBalanceBeforeExit = await dai.balanceOf(vault.address);
                const ownerDAIBalanceBeforeExit = await dai.balanceOf(owner.address);
                const userData = abi_coder_1.defaultAbiCoder.encode(['uint256', 'uint256'], [LegacyStablePoolExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptBalance]);
                // Send BPT to the relayer so it can exit.
                await pool.connect(owner).transfer(relayer.address, bptBalance);
                const exitCalldata = library.interface.encodeFunctionData('exitPool', [
                    poolId,
                    sharedStableParams_1.PoolKind.LEGACY_STABLE,
                    relayer.address,
                    owner.address,
                    {
                        assets: sharedStableParams_1.tokens,
                        minAmountsOut: sharedStableParams_1.tokens.map(() => 0),
                        toInternalBalance: false,
                        userData,
                    },
                    [],
                ]);
                await relayer.connect(owner).multicall([exitCalldata]);
                const remainingBalance = await pool.balanceOf(owner.address);
                (0, chai_1.expect)(remainingBalance).to.equal(0);
                const vaultDAIBalanceAfterExit = await dai.balanceOf(vault.address);
                const ownerDAIBalanceAfterExit = await dai.balanceOf(owner.address);
                (0, chai_1.expect)(vaultDAIBalanceAfterExit).to.lt(vaultDAIBalanceBeforeExit);
                (0, chai_1.expect)(ownerDAIBalanceAfterExit).to.gt(ownerDAIBalanceBeforeExit);
            });
        });
        context('metastable pool', () => {
            before('run stable pool task', async () => {
                stableTask = new _src_1.Task('20210727-meta-stable-pool', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
                factory = await stableTask.deployedInstance('MetaStablePoolFactory');
            });
            before('deploy meta stable pool', async () => {
                const tx = await factory.create('MSP', 'MSPT', sharedStableParams_1.tokens, sharedStableParams_1.amplificationParameter, sharedStableParams_1.rateProviders, sharedStableParams_1.cacheDurations, sharedStableParams_1.swapFeePercentage, false, // oracle enabled
                owner.address);
                const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
                pool = await stableTask.instanceAt('MetaStablePool', event.args.pool);
                (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
                poolId = await pool.getPoolId();
                const [registeredAddress] = await vault.getPool(poolId);
                (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
            });
            before('initialize meta stable pool', async () => {
                const userData = encoder_1.StablePoolEncoder.joinInit(sharedStableParams_1.initialBalances);
                await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
                    assets: sharedStableParams_1.tokens,
                    maxAmountsIn: sharedStableParams_1.initialBalances,
                    fromInternalBalance: false,
                    userData,
                });
            });
            it('can exit proportionally through the relayer', async () => {
                const bptBalance = await pool.balanceOf(owner.address);
                (0, chai_1.expect)(bptBalance).to.gt(0);
                const vaultDAIBalanceBeforeExit = await dai.balanceOf(vault.address);
                const ownerDAIBalanceBeforeExit = await dai.balanceOf(owner.address);
                const userData = abi_coder_1.defaultAbiCoder.encode(['uint256', 'uint256'], [LegacyStablePoolExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptBalance]);
                // Send BPT to the relayer so it can exit.
                await pool.connect(owner).transfer(relayer.address, bptBalance);
                const exitCalldata = library.interface.encodeFunctionData('exitPool', [
                    poolId,
                    sharedStableParams_1.PoolKind.LEGACY_STABLE,
                    relayer.address,
                    owner.address,
                    {
                        assets: sharedStableParams_1.tokens,
                        minAmountsOut: sharedStableParams_1.tokens.map(() => 0),
                        toInternalBalance: false,
                        userData,
                    },
                    [],
                ]);
                await relayer.connect(owner).multicall([exitCalldata]);
                const remainingBalance = await pool.balanceOf(owner.address);
                (0, chai_1.expect)(remainingBalance).to.equal(0);
                const vaultDAIBalanceAfterExit = await dai.balanceOf(vault.address);
                const ownerDAIBalanceAfterExit = await dai.balanceOf(owner.address);
                (0, chai_1.expect)(vaultDAIBalanceAfterExit).to.lt(vaultDAIBalanceBeforeExit);
                (0, chai_1.expect)(ownerDAIBalanceAfterExit).to.gt(ownerDAIBalanceBeforeExit);
            });
        });
    });
});
