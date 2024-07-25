"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const time_1 = require("@helpers/time");
const actions_1 = require("@helpers/models/misc/actions");
(0, _src_1.describeForkTest)('GaugeWorkingBalanceHelper-L2', 'polygon', 42002545, function () {
    let workingBalanceHelper;
    let veDelegationProxy;
    let votingEscrow;
    let gauge;
    let authorizer;
    let lpTokenHolder;
    let other;
    let veBALHolder;
    let lpToken;
    // Note that at the time of this test, nobody has staked in this gauge.
    const GAUGE = '0x1f0ee42d005b89814a01f050416b28c3142ac900';
    const LP_TOKEN = '0x924ec7ed38080e40396c46f6206a6d77d0b9f72d';
    const LP_TOKEN_HOLDER = '0x9824697f7c12cabada9b57842060931c48dea969';
    const GOV_MULTISIG = '0xeE071f4B516F69a1603dA393CdE8e76C40E5Be85';
    let task;
    before('run task', async () => {
        task = new _src_1.Task('20230526-gauge-working-balance-helper', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        workingBalanceHelper = await task.deployedInstance('GaugeWorkingBalanceHelper');
    });
    before('setup accounts', async () => {
        [, veBALHolder, other] = await (0, _src_1.getSigners)();
        lpTokenHolder = await (0, _src_1.impersonate)(LP_TOKEN_HOLDER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        const proxyTask = new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        veDelegationProxy = await proxyTask.deployedInstance('VotingEscrowDelegationProxy');
        votingEscrow = await proxyTask.deployedInstance('NullVotingEscrow');
        const gaugeFactoryTask = new _src_1.Task('20230316-child-chain-gauge-factory-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gauge = await gaugeFactoryTask.instanceAt('ChildChainGauge', GAUGE);
        lpToken = await (0, _src_1.instanceAt)('IERC20', LP_TOKEN);
    });
    before('stake in gauge', async () => {
        const stakeAmount = (0, numbers_1.fp)(100);
        await lpToken.connect(lpTokenHolder).transfer(veBALHolder.address, stakeAmount);
        await lpToken.connect(veBALHolder).approve(gauge.address, constants_1.MAX_UINT256);
        await gauge.connect(veBALHolder)['deposit(uint256)'](stakeAmount);
        // We also have `other` stake in the gauge so that the veBALHolder is not the sole gauge staker, and their supply
        // ratio is less than 100%.
        const smallerStakeAmount = stakeAmount.div(2);
        await lpToken.connect(lpTokenHolder).transfer(other.address, smallerStakeAmount);
        await lpToken.connect(other).approve(gauge.address, constants_1.MAX_UINT256);
        await gauge.connect(other)['deposit(uint256)'](smallerStakeAmount);
    });
    describe('getters (as deployed)', () => {
        it('stores the veDelegationProxy', async () => {
            (0, chai_1.expect)(await workingBalanceHelper.getVotingEscrowDelegationProxy()).to.equal(veDelegationProxy.address);
        });
        it('stores the votingEscrow', async () => {
            (0, chai_1.expect)(await workingBalanceHelper.getVotingEscrow()).to.equal(votingEscrow.address);
        });
        it('indicates where to read supply from', async () => {
            (0, chai_1.expect)(await workingBalanceHelper.readsTotalSupplyFromVE()).to.be.false;
        });
    });
    context('with no veBAL', () => {
        it('projected balance should equal current', async () => {
            const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
            // Ensure we have equal balances (that are non-zero)
            (0, chai_1.expect)(projectedWorkingBalance).to.eq(currentWorkingBalance);
            (0, chai_1.expect)(projectedWorkingBalance).to.gt(0);
        });
        it('projected ratio should equal current', async () => {
            const [current, projected] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(gauge.address, veBALHolder.address);
            (0, chai_1.expect)(projected).to.eq(current);
            // As a sanity check, we test that they don't own the entire gauge.
            (0, chai_1.expect)(projected).to.be.lt(numbers_1.FP_ONE);
        });
    });
    describe('with veBAL', () => {
        let newVotingEscrow;
        before('setup contracts', async () => {
            newVotingEscrow = await (0, _src_1.deploy)('MockL2VotingEscrow');
            const admin = await (0, _src_1.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
            await authorizer.connect(admin).grantRole(await (0, actions_1.actionId)(veDelegationProxy, 'setDelegation'), admin.address);
            await veDelegationProxy.connect(admin).setDelegation(newVotingEscrow.address);
        });
        const veBALTotal = (0, numbers_1.fp)(1000);
        before('create veBAL whale', async () => {
            // The lock duration is irrelevant because this mock voting escrow doesn't take it into consideration.
            await newVotingEscrow.connect(veBALHolder).create_lock(veBALTotal, time_1.MONTH * 12);
        });
        it('shows a veBAL balance', async () => {
            (0, chai_1.expect)(await newVotingEscrow.balanceOf(veBALHolder.address)).to.eq(veBALTotal);
        });
        it(`projected balance should be greater than current`, async () => {
            const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
            (0, chai_1.expect)(projectedWorkingBalance).to.be.gt(currentWorkingBalance);
        });
        it('projected ratio should be greater than current', async () => {
            const [currentWorkingRatio, projectedWorkingRatio] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(gauge.address, veBALHolder.address);
            (0, chai_1.expect)(projectedWorkingRatio).to.be.gt(currentWorkingRatio);
        });
        context('updates after checkpointing', () => {
            before('checkpoint', async () => {
                await gauge.connect(veBALHolder).user_checkpoint(veBALHolder.address);
            });
            it('projected balance should be equal to or slightly less than current', async () => {
                const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
                (0, chai_1.expect)(projectedWorkingBalance).to.be.almostEqual(currentWorkingBalance);
                (0, chai_1.expect)(projectedWorkingBalance).to.be.lte(currentWorkingBalance);
            });
            it('projected ratio should be equal to or slightly less than current', async () => {
                const [currentWorkingRatio, projectedWorkingRatio] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(gauge.address, veBALHolder.address);
                (0, chai_1.expect)(projectedWorkingRatio).to.be.almostEqual(currentWorkingRatio);
                (0, chai_1.expect)(projectedWorkingRatio).to.be.lte(currentWorkingRatio);
            });
        });
    });
});
