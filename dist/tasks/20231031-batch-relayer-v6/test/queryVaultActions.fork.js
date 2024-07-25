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
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const types_1 = require("@helpers/models/types/types");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const numbers_1 = require("@helpers/numbers");
const _src_1 = require("@src");
const constants_1 = require("@helpers/constants");
const utils_1 = require("ethers/lib/utils");
(0, _src_1.describeForkTest)('BatchRelayerLibrary V6 - Query functionality', 'mainnet', 18412883, function () {
    const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const MKR = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2';
    const tokens = [DAI, MKR];
    const initialBalances = [(0, numbers_1.fp)(1400), (0, numbers_1.fp)(1)];
    const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';
    const NAME = 'Balancer Pool Token';
    const SYMBOL = 'BPT';
    const POOL_SWAP_FEE_PERCENTAGE = (0, numbers_1.fp)(0.01);
    const WEIGHTS = [(0, numbers_1.fp)(0.5), (0, numbers_1.fp)(0.5)];
    let task;
    let weightedTask;
    let owner;
    let relayer, library;
    let vault;
    let balancerQueries;
    let factory;
    let dai;
    let mkr;
    let whale;
    before('run tasks', async () => {
        task = new _src_1.Task('20231031-batch-relayer-v6', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        // Load BalancerQueries
        const balancerQueriesTask = new _src_1.Task('20220721-balancer-queries', _src_1.TaskMode.READ_ONLY, task.network);
        balancerQueries = await balancerQueriesTask.deployedInstance('BalancerQueries');
        weightedTask = new _src_1.Task('20230320-weighted-pool-v4', _src_1.TaskMode.READ_ONLY, task.network);
        factory = await weightedTask.deployedInstance('WeightedPoolFactory');
        dai = await task.instanceAt('IERC20', DAI);
        mkr = await task.instanceAt('IERC20', MKR);
        whale = await (0, _src_1.impersonate)(LARGE_TOKEN_HOLDER);
    });
    before('get signers', async () => {
        owner = await (0, _src_1.getSigner)();
    });
    function toChainedReference(key) {
        // Use the permanent prefix (temporary is 'ba10')
        const CHAINED_REFERENCE_PREFIX = 'ba11';
        // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
        const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;
        return ethers_1.BigNumber.from(paddedPrefix).add(key);
    }
    async function createPool(salt = '') {
        const receipt = await (await factory.create(NAME, SYMBOL, tokens, WEIGHTS, [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS], POOL_SWAP_FEE_PERCENTAGE, owner.address, salt == '' ? (0, utils_1.randomBytes)(32) : salt)).wait();
        const event = expectEvent.inReceipt(receipt, 'PoolCreated');
        return weightedTask.instanceAt('WeightedPool', event.args.pool);
    }
    async function initPool(poolId) {
        await dai.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        await mkr.connect(whale).approve(vault.address, constants_1.MAX_UINT256);
        const userData = encoder_1.WeightedPoolEncoder.joinInit(initialBalances);
        await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
            assets: tokens,
            maxAmountsIn: initialBalances,
            fromInternalBalance: false,
            userData,
        });
    }
    describe('swap equivalance', () => {
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
        describe('compare to Balancer Queries', () => {
            const amountIn = (0, numbers_1.fp)(100);
            let actualAmountOut;
            let expectedAmountOut;
            sharedBeforeEach('do BalancerQuery', async () => {
                // Do a swap through Balancer Queries
                expectedAmountOut = await balancerQueries.callStatic.querySwap({
                    poolId: poolId,
                    kind: types_1.SwapKind.GivenIn,
                    assetIn: DAI,
                    assetOut: MKR,
                    amount: amountIn,
                    userData: '0x',
                }, {
                    sender: owner.address,
                    recipient: owner.address,
                    fromInternalBalance: false,
                    toInternalBalance: false,
                });
            });
            it('check direct swap', async () => {
                const callData = library.interface.encodeFunctionData('swap', [
                    {
                        poolId: poolId,
                        kind: types_1.SwapKind.GivenIn,
                        assetIn: DAI,
                        assetOut: MKR,
                        amount: amountIn,
                        userData: '0x',
                    },
                    {
                        sender: owner.address,
                        recipient: owner.address,
                        fromInternalBalance: false,
                        toInternalBalance: false,
                    },
                    0,
                    constants_1.MAX_UINT256,
                    0,
                    0,
                ]);
                [actualAmountOut] = await relayer.connect(owner).callStatic.vaultActionsQueryMulticall([callData]);
                (0, chai_1.expect)(actualAmountOut).to.equal(expectedAmountOut);
            });
            it('check swap with peek', async () => {
                // Trying internal peek
                const outputReference = toChainedReference(3);
                // Do the same swap through the relayer, and store the output in a chained reference
                const swapData = library.interface.encodeFunctionData('swap', [
                    {
                        poolId: poolId,
                        kind: types_1.SwapKind.GivenIn,
                        assetIn: DAI,
                        assetOut: MKR,
                        amount: amountIn,
                        userData: '0x',
                    },
                    {
                        sender: owner.address,
                        recipient: owner.address,
                        fromInternalBalance: false,
                        toInternalBalance: false,
                    },
                    0,
                    constants_1.MAX_UINT256,
                    0,
                    outputReference,
                ]);
                const peekData = library.interface.encodeFunctionData('peekChainedReferenceValue', [outputReference]);
                const results = await relayer.connect(owner).callStatic.vaultActionsQueryMulticall([swapData, peekData]);
                actualAmountOut = results[1];
                (0, chai_1.expect)(actualAmountOut).to.equal(expectedAmountOut);
            });
        });
    });
    it('does not allow calls to manageUserBalance', async () => {
        let UserBalanceOpKind;
        (function (UserBalanceOpKind) {
            UserBalanceOpKind[UserBalanceOpKind["DepositInternal"] = 0] = "DepositInternal";
            UserBalanceOpKind[UserBalanceOpKind["WithdrawInternal"] = 1] = "WithdrawInternal";
            UserBalanceOpKind[UserBalanceOpKind["TransferInternal"] = 2] = "TransferInternal";
            UserBalanceOpKind[UserBalanceOpKind["TransferExternal"] = 3] = "TransferExternal";
        })(UserBalanceOpKind || (UserBalanceOpKind = {}));
        const amount = (0, numbers_1.fp)(100);
        const callData = library.interface.encodeFunctionData('manageUserBalance', [
            [
                {
                    kind: UserBalanceOpKind.DepositInternal,
                    asset: DAI,
                    amount,
                    sender: owner.address,
                    recipient: owner.address,
                },
                {
                    kind: UserBalanceOpKind.DepositInternal,
                    asset: MKR,
                    amount,
                    sender: owner.address,
                    recipient: owner.address,
                },
            ],
            0,
            [],
        ]);
        await (0, chai_1.expect)(relayer.connect(owner).vaultActionsQueryMulticall([callData])).to.be.revertedWith('BAL#998');
    });
});
