"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
const BAL_ETH_POOL_ID = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
const TUSD_BBAUSD_ID = '0x2ba7aa2213fa2c909cd9e46fed5a0059542b36b00000000000000000000003a3';
const BB_E_DAI_ID = '0xeb486af868aeb3b6e53066abc9623b1041b42bc000000000000000000000046c';
const BB_E_USDT_ID = '0x3c640f0d3036ad85afa2d5a9e32be651657b874f00000000000000000000046b';
const BB_E_USD_ID = '0x50cf90b954958480b8df7958a9e965752f62712400000000000000000000046f';
(0, _src_1.describeForkTest)('BalancerPoolDataQueries', 'mainnet', 17413298, function () {
    let balancerPoolDataQueries;
    before('deploy balancer pool data queries', async () => {
        const task = new _src_1.Task('20230613-balancer-pool-data-queries', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        balancerPoolDataQueries = await task.deployedInstance('BalancerPoolDataQueries');
    });
    context('get pool status data', () => {
        it('loads in recovery mode and paused status', async () => {
            const response = await balancerPoolDataQueries.getPoolStatus([BAL_ETH_POOL_ID, BB_E_USDT_ID], {
                loadInRecoveryMode: true,
                loadIsPaused: true,
            });
            (0, chai_1.expect)(response.isPaused.length).to.equal(2);
            (0, chai_1.expect)(response.inRecoveryMode.length).to.equal(2);
            (0, chai_1.expect)(response.isPaused[0]).to.equal(false);
            (0, chai_1.expect)(response.inRecoveryMode[0]).to.equal(false);
            (0, chai_1.expect)(response.isPaused[1]).to.equal(true);
            (0, chai_1.expect)(response.inRecoveryMode[1]).to.equal(true);
        });
        it('loads only recovery mode', async () => {
            const response = await balancerPoolDataQueries.getPoolStatus([BAL_ETH_POOL_ID], {
                loadInRecoveryMode: true,
                loadIsPaused: false,
            });
            (0, chai_1.expect)(response.isPaused.length).to.equal(0);
            (0, chai_1.expect)(response.inRecoveryMode.length).to.equal(1);
            (0, chai_1.expect)(response.inRecoveryMode[0]).to.equal(false);
        });
        it('loads only is paused', async () => {
            const response = await balancerPoolDataQueries.getPoolStatus([BAL_ETH_POOL_ID], {
                loadInRecoveryMode: false,
                loadIsPaused: true,
            });
            (0, chai_1.expect)(response.isPaused.length).to.equal(1);
            (0, chai_1.expect)(response.inRecoveryMode.length).to.equal(0);
            (0, chai_1.expect)(response.isPaused[0]).to.equal(false);
        });
        it('identifies pools in recovery mode', async () => {
            const response = await balancerPoolDataQueries.getPoolStatus([BAL_ETH_POOL_ID, TUSD_BBAUSD_ID, BB_E_DAI_ID], {
                loadInRecoveryMode: true,
                loadIsPaused: false,
            });
            (0, chai_1.expect)(response.inRecoveryMode.length).to.equal(3);
            (0, chai_1.expect)(response.inRecoveryMode[0]).to.equal(false);
            (0, chai_1.expect)(response.inRecoveryMode[1]).to.equal(true);
            (0, chai_1.expect)(response.inRecoveryMode[2]).to.equal(true);
        });
        it('identifies paused pools', async () => {
            const response = await balancerPoolDataQueries.getPoolStatus([BAL_ETH_POOL_ID, BB_E_USDT_ID, BB_E_USD_ID], {
                loadInRecoveryMode: false,
                loadIsPaused: true,
            });
            (0, chai_1.expect)(response.isPaused.length).to.equal(3);
            (0, chai_1.expect)(response.isPaused[0]).to.equal(false);
            (0, chai_1.expect)(response.isPaused[1]).to.equal(true);
            (0, chai_1.expect)(response.isPaused[2]).to.equal(true);
        });
    });
});
