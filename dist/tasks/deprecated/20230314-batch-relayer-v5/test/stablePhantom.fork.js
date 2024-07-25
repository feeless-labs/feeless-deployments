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
const abi_coder_1 = require("@ethersproject/abi/lib/abi-coder");
const actions_1 = require("@helpers/models/misc/actions");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const sharedStableParams_1 = require("./helpers/sharedStableParams");
(0, _src_1.describeForkTest)('Stable Phantom Exit', 'mainnet', 13776527, function () {
    let vault, authorizer;
    before('load vault and tokens', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
    });
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    let ExitKindPhantom;
    (function (ExitKindPhantom) {
        ExitKindPhantom[ExitKindPhantom["EXACT_BPT_IN_FOR_TOKENS_OUT"] = 0] = "EXACT_BPT_IN_FOR_TOKENS_OUT";
    })(ExitKindPhantom || (ExitKindPhantom = {}));
    let owner, whale, govMultisig;
    let pool, factory;
    let usdc, dai;
    let poolId;
    let stableTask;
    let bptIndex;
    before('get signers', async () => {
        owner = await (0, _src_1.getSigner)();
        whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
        govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
    });
    before('run stable phantom pool task', async () => {
        stableTask = new _src_1.Task('20211208-stable-phantom-pool', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        factory = await stableTask.deployedInstance('StablePhantomPoolFactory');
    });
    before('load tokens and approve', async () => {
        dai = await stableTask.instanceAt('IERC20', sharedStableParams_1.DAI);
        usdc = await stableTask.instanceAt('IERC20', sharedStableParams_1.USDC);
        await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await usdc.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
    });
    before('create pool', async () => {
        const tx = await factory.create('SP', 'SPT', sharedStableParams_1.tokens, sharedStableParams_1.amplificationParameter, sharedStableParams_1.rateProviders, sharedStableParams_1.cacheDurations, sharedStableParams_1.swapFeePercentage, owner.address);
        const event = expectEvent.inReceipt(await tx.wait(), 'PoolCreated');
        pool = await stableTask.instanceAt('StablePhantomPool', event.args.pool);
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
    });
    before('pause pool', async () => {
        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(pool, 'setPaused'), govMultisig.address);
        await pool.connect(govMultisig).setPaused(true);
        const { paused } = await pool.getPausedState();
        (0, chai_1.expect)(paused).to.be.true;
    });
    it('exits proportionally when paused', async () => {
        const previousBptBalance = await pool.balanceOf(owner.address);
        const bptIn = previousBptBalance.div(4);
        const { tokens: registeredTokens, balances: registeredBalances } = await vault.getPoolTokens(poolId);
        const tx = await vault.connect(owner).exitPool(poolId, owner.address, owner.address, {
            assets: registeredTokens,
            minAmountsOut: Array(registeredTokens.length).fill(0),
            fromInternalBalance: false,
            userData: abi_coder_1.defaultAbiCoder.encode(['uint256', 'uint256'], [ExitKindPhantom.EXACT_BPT_IN_FOR_TOKENS_OUT, bptIn]),
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
