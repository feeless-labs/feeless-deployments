"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const time_1 = require("@helpers/time");
const expectTransfer_1 = require("@helpers/expectTransfer");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('DistributionScheduler', 'mainnet', 14850000, function () {
    let lmCommittee, distributor;
    let scheduler, gauge, DAI, USDC;
    let task;
    const LM_COMMITTEE_ADDRESS = '0xc38c5f97B34E175FFd35407fc91a937300E33860';
    const DISTRIBUTOR_ADDRESS = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503'; // Owns DAI and USDC
    const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const daiWeeklyAmount = (0, numbers_1.fp)(42);
    const usdcWeeklyAmount = (0, numbers_1.bn)(1337e6); // USDC has 6 tokens
    const GAUGE_ADDRESS = '0x4E3c048BE671852277Ad6ce29Fd5207aA12fabff';
    before('run task', async () => {
        task = new _src_1.Task('20220707-distribution-scheduler', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        scheduler = await task.instanceAt('DistributionScheduler', task.output({ network: 'test' }).DistributionScheduler);
    });
    before('setup accounts', async () => {
        lmCommittee = await (0, _src_1.impersonate)(LM_COMMITTEE_ADDRESS);
        distributor = await (0, _src_1.impersonate)(DISTRIBUTOR_ADDRESS);
    });
    before('setup contracts', async () => {
        // We reuse this task as it contains an ABI similar to the one in real ERC20 tokens
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        DAI = await testBALTokenTask.instanceAt('TestBalancerToken', DAI_ADDRESS);
        USDC = await testBALTokenTask.instanceAt('TestBalancerToken', USDC_ADDRESS);
        const gaugeFactoryTask = new _src_1.Task('20220325-mainnet-gauge-factory', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gauge = await gaugeFactoryTask.instanceAt('LiquidityGaugeV5', GAUGE_ADDRESS);
    });
    before('add reward tokens to gauge', async () => {
        const authorizerAdaptorTask = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        const authorizerAdaptor = await authorizerAdaptorTask.instanceAt('AuthorizerAdaptor', authorizerAdaptorTask.output({ network: 'mainnet' }).AuthorizerAdaptor);
        await Promise.all([DAI, USDC].map((token) => authorizerAdaptor.connect(lmCommittee).performAction(gauge.address, 
        // Note that we need to make the scheduler the distributor
        gauge.interface.encodeFunctionData('add_reward', [token.address, scheduler.address]))));
        (0, chai_1.expect)(await gauge.reward_count()).to.equal(2);
    });
    before('approve tokens', async () => {
        await USDC.connect(distributor).approve(scheduler.address, constants_1.MAX_UINT256);
        await DAI.connect(distributor).approve(scheduler.address, constants_1.MAX_UINT256);
    });
    it('schedules rewards', async () => {
        const nextWeek = (await (0, time_1.currentWeekTimestamp)()).add(time_1.WEEK);
        await scheduler.connect(distributor).scheduleDistribution(gauge.address, DAI.address, daiWeeklyAmount, nextWeek);
        await scheduler.connect(distributor).scheduleDistribution(gauge.address, USDC.address, usdcWeeklyAmount, nextWeek);
        await scheduler
            .connect(distributor)
            .scheduleDistribution(gauge.address, USDC.address, usdcWeeklyAmount, nextWeek.add(time_1.WEEK));
        // Fist week
        (0, chai_1.expect)(await scheduler.getPendingRewardsAt(gauge.address, DAI.address, nextWeek)).to.equal(daiWeeklyAmount);
        (0, chai_1.expect)(await scheduler.getPendingRewardsAt(gauge.address, USDC.address, nextWeek)).to.equal(usdcWeeklyAmount);
        // Second week
        (0, chai_1.expect)(await scheduler.getPendingRewardsAt(gauge.address, USDC.address, nextWeek.add(time_1.WEEK))).to.equal(usdcWeeklyAmount.mul(2));
    });
    it('does not distribute rewards until the scheduled time arrives', async () => {
        const daiBalanceBefore = await DAI.balanceOf(scheduler.address);
        const usdcBalanceBefore = await USDC.balanceOf(scheduler.address);
        await scheduler.startDistributions(gauge.address);
        const daiBalanceAfter = await DAI.balanceOf(scheduler.address);
        const usdcBalanceAfter = await USDC.balanceOf(scheduler.address);
        (0, chai_1.expect)(daiBalanceAfter).to.equal(daiBalanceBefore);
        (0, chai_1.expect)(usdcBalanceAfter).to.equal(usdcBalanceBefore);
    });
    it('distributes rewards', async () => {
        await (0, time_1.advanceTime)((await (0, time_1.currentWeekTimestamp)()).add(time_1.MONTH));
        const tx = await scheduler.startDistributions(gauge.address);
        // Ideally we'd look for events on the gauge as it processes the deposit, but deposit_reward_token emits no events.
        (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: scheduler.address, to: gauge.address, value: daiWeeklyAmount }, DAI.address);
        (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: scheduler.address, to: gauge.address, value: usdcWeeklyAmount.mul(2) }, USDC.address);
    });
});
