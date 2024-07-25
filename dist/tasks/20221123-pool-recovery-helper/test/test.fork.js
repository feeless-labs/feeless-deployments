"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const actions_1 = require("@helpers/models/misc/actions");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const abi_1 = require("@ethersproject/abi");
(0, _src_1.describeForkTest)('PoolRecoveryHelper', 'mainnet', 15998800, function () {
    let task;
    let helper;
    let operator, admin;
    let authorizer;
    const POOL_STABLE = '0xbD482fFb3E6E50dC1c437557C3Bea2B68f3683Ee'; // From ComposableStablePoolFactory
    const POOL_WEIGHTED = '0xe340EBfcAA544da8bB1Ee9005F1a346D50Ec422e'; // From WeightedPoolFactory
    before('run task', async () => {
        task = new _src_1.Task('20221123-pool-recovery-helper', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        helper = await task.deployedInstance('PoolRecoveryHelper');
    });
    before('load vault', async () => {
        const authorizerTask = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        authorizer = await authorizerTask.deployedInstance('Authorizer');
    });
    before('load signers', async () => {
        // We impersonate an account with the default admin role in order to be able to grant permissions. This assumes
        // such an account exists.
        admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));
        operator = await (0, _src_1.getSigner)();
    });
    before('approve helper at the authorizer', async () => {
        const selector = new abi_1.Interface(task.artifact('IRecoveryMode').abi).getSighash('enableRecoveryMode()');
        const actionIds = await Promise.all([POOL_STABLE, POOL_WEIGHTED].map(async (poolAddress) => {
            const pool = await task.instanceAt('IAuthentication', poolAddress);
            return await pool.getActionId(selector);
        }));
        // Grant helper permission to enable recovery mode
        await authorizer.connect(admin).grantRoles(actionIds, helper.address);
    });
    before('approve operator at the authorizer', async () => {
        const actionIds = await Promise.all(['addPoolFactory', 'removePoolFactory'].map(async (method) => (0, actions_1.actionId)(helper, method)));
        await authorizer.connect(admin).grantRoles(actionIds, operator.address);
    });
    context('with ComposableStablePool', () => {
        itWorksWithPool(POOL_STABLE);
    });
    context('with WeightedPool', () => {
        itWorksWithPool(POOL_WEIGHTED);
    });
    function itWorksWithPool(poolAddress) {
        it('recognizes pools from the initial factories', async () => {
            (0, chai_1.expect)(await helper.isPoolFromKnownFactory(poolAddress)).to.equal(true);
        });
        it("reverts if the pool rate providers don't revert", async () => {
            await (0, chai_1.expect)(helper.enableRecoveryMode(poolAddress)).to.be.revertedWith("Pool's rate providers do not revert");
        });
        it('puts the pool in recovery mode if one of the rate providers reverts', async () => {
            // We get the first non-zero rate provider of the Pool, and replace it with a mock one that reverts
            const rateProviderPool = await task.instanceAt('IRateProviderPool', poolAddress);
            const rateProviders = await rateProviderPool.getRateProviders();
            const mockedRateProvider = rateProviders.filter((provider) => provider !== constants_1.ZERO_ADDRESS)[0];
            // Make sure there's at least one rate provider
            (0, chai_1.expect)(mockedRateProvider).to.not.equal(undefined);
            await (0, hardhat_network_helpers_1.setCode)(mockedRateProvider, (await task.artifact('MockRevertingRateProvider')).deployedBytecode);
            const mockLendingPool = await task.instanceAt('MockRevertingRateProvider', mockedRateProvider);
            await mockLendingPool.setRevertOnGetRate(true);
            await helper.enableRecoveryMode(poolAddress);
            const recoveryModePool = await task.instanceAt('IRecoveryMode', poolAddress);
            (0, chai_1.expect)(await recoveryModePool.inRecoveryMode()).to.equal(true);
        });
    }
});
