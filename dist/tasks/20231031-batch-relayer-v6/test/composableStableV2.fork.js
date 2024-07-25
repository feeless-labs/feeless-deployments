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
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const sharedStableParams_1 = require("./helpers/sharedStableParams");
(0, _src_1.describeForkTest)('BatchRelayerLibrary V6 - Composable Stable V2+', 'mainnet', 16789433, function () {
    let task;
    let relayer, library;
    let vault, authorizer;
    before('run task', async () => {
        task = new _src_1.Task('20231031-batch-relayer-v6', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load vault and authorizer', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    let owner, whale;
    let pool, factory;
    let usdc, dai;
    let poolId;
    let stableTask;
    let bptIndex;
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
        await vault.connect(whale).setRelayerApproval(whale.address, relayer.address, true);
    });
    before('load tokens and approve', async () => {
        dai = await task.instanceAt('IERC20', sharedStableParams_1.DAI);
        usdc = await task.instanceAt('IERC20', sharedStableParams_1.USDC);
        await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
    });
    // Use V3 so that it's not disabled: same as V2 for joins/exits
    before('run composable stable pool V2+ task', async () => {
        stableTask = new _src_1.Task('20230206-composable-stable-pool-v3', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        factory = await stableTask.deployedInstance('ComposableStablePoolFactory');
    });
    async function createPool() {
        const tx = await factory.create('SP', 'SPT', sharedStableParams_1.tokens, sharedStableParams_1.amplificationParameter, sharedStableParams_1.rateProviders, sharedStableParams_1.cacheDurations, sharedStableParams_1.exemptFlags, sharedStableParams_1.swapFeePercentage, owner.address);
        const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
        pool = await stableTask.instanceAt('ComposableStablePool', event.args.pool);
        (0, chai_1.expect)(await factory.isPoolFromFactory(pool.address)).to.be.true;
        poolId = await pool.getPoolId();
        const [registeredAddress] = await vault.getPool(poolId);
        (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
        bptIndex = await pool.getBptIndex();
        const composableInitialBalances = Array.from({ length: sharedStableParams_1.tokens.length + 1 }).map((_, i) => i == bptIndex ? 0 : i < bptIndex ? sharedStableParams_1.initialBalances[i] : sharedStableParams_1.initialBalances[i - 1]);
        const { tokens: allTokens } = await vault.getPoolTokens(poolId);
        const userData = encoder_1.StablePoolEncoder.joinInit(composableInitialBalances);
        await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
            assets: allTokens,
            maxAmountsIn: Array(sharedStableParams_1.tokens.length + 1).fill(constants_1.MAX_UINT256),
            fromInternalBalance: false,
            userData,
        });
        return pool;
    }
    describe('proportional join/exit through relayer', () => {
        before('deploy pool', async () => {
            pool = await createPool();
            poolId = await pool.getPoolId();
            const [registeredAddress] = await vault.getPool(poolId);
            (0, chai_1.expect)(registeredAddress).to.equal(pool.address);
        });
        it('can join and exit', async () => {
            const bptAmount = (0, numbers_1.fp)(1000);
            const whaleDAIBalanceBeforeJoinExit = await dai.balanceOf(whale.address);
            const ownerDAIBalanceBeforeJoinExit = await dai.balanceOf(owner.address);
            const { tokens: allTokens } = await vault.getPoolTokens(poolId);
            const joinUserData = encoder_1.StablePoolEncoder.joinAllTokensInForExactBptOut(bptAmount);
            const joinCalldata = library.interface.encodeFunctionData('joinPool', [
                poolId,
                sharedStableParams_1.PoolKind.COMPOSABLE_STABLE_V2,
                whale.address,
                whale.address,
                {
                    assets: allTokens,
                    maxAmountsIn: Array(sharedStableParams_1.tokens.length + 1).fill(constants_1.MAX_UINT256),
                    userData: joinUserData,
                    fromInternalBalance: false,
                },
                0,
                0,
            ]);
            const exitUserData = encoder_1.StablePoolEncoder.exitExactBptInForTokensOut(bptAmount);
            const exitCalldata = library.interface.encodeFunctionData('exitPool', [
                poolId,
                sharedStableParams_1.PoolKind.COMPOSABLE_STABLE_V2,
                whale.address,
                owner.address,
                {
                    assets: allTokens,
                    minAmountsOut: Array(sharedStableParams_1.tokens.length + 1).fill(0),
                    userData: exitUserData,
                    toInternalBalance: false,
                },
                [],
            ]);
            await relayer.connect(whale).multicall([joinCalldata, exitCalldata]);
            const whaleDAIBalanceAfterJoinExit = await dai.balanceOf(whale.address);
            const ownerDAIBalanceAfterJoinExit = await dai.balanceOf(owner.address);
            (0, chai_1.expect)(whaleDAIBalanceAfterJoinExit).to.lt(whaleDAIBalanceBeforeJoinExit);
            (0, chai_1.expect)(ownerDAIBalanceAfterJoinExit).to.gt(ownerDAIBalanceBeforeJoinExit);
        });
    });
});
