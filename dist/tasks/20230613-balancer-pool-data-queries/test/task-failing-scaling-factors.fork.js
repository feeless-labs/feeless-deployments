"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
const BBAUSDC = '0x82698aecc9e28e9bb27608bd52cf57f704bd1b83';
const BBAUSDC_POOL_ID = '0x82698aecc9e28e9bb27608bd52cf57f704bd1b83000000000000000000000336';
const POOL_WITH_FAILING_SCALING_FACTORS_ID = '0x3c640f0d3036ad85afa2d5a9e32be651657b874f00000000000000000000046b';
const POOL_WITH_FAILING_SCALING_FACTORS = '0x3c640f0d3036ad85afa2d5a9e32be651657b874f';
const defaultPoolDataQueryConfig = {
    loadTokenBalanceUpdatesAfterBlock: false,
    loadTotalSupply: false,
    loadSwapFees: false,
    loadLinearWrappedTokenRates: false,
    loadNormalizedWeights: false,
    loadScalingFactors: false,
    loadAmps: false,
    loadRates: false,
    blockNumber: 0,
    totalSupplyTypes: [],
    swapFeeTypes: [],
    linearPoolIdxs: [],
    weightedPoolIdxs: [],
    scalingFactorPoolIdxs: [],
    ampPoolIdxs: [],
    ratePoolIdxs: [],
};
(0, _src_1.describeForkTest)('BalancerPoolDataQueries', 'mainnet', 17238447, function () {
    let balancerPoolDataQueries;
    before('deploy balancer pool data queries', async () => {
        const task = new _src_1.Task('20230613-balancer-pool-data-queries', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        balancerPoolDataQueries = await task.deployedInstance('BalancerPoolDataQueries');
    });
    context('handles failing scaling factors', () => {
        it('Should return an empty array for a pool with failing scaling factors', async () => {
            const response = await balancerPoolDataQueries.getScalingFactorsForPools([
                BBAUSDC,
                POOL_WITH_FAILING_SCALING_FACTORS,
            ]);
            (0, chai_1.expect)(response.length).to.equal(2);
            (0, chai_1.expect)(response[0].length).to.equal(3);
            (0, chai_1.expect)(response[1].length).to.equal(0);
        });
        it('Should add the pool to ignoreIdxs when it has failing scaling factors', async () => {
            const response = await balancerPoolDataQueries.getPoolData([BBAUSDC_POOL_ID, POOL_WITH_FAILING_SCALING_FACTORS_ID], {
                ...defaultPoolDataQueryConfig,
                loadScalingFactors: true,
                scalingFactorPoolIdxs: [0, 1],
            });
            (0, chai_1.expect)(response.ignoreIdxs[0]).to.equal(1);
        });
    });
});
