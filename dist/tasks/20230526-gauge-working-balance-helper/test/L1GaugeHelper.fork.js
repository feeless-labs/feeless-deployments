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
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const time_1 = require("@helpers/time");
(0, _src_1.describeForkTest)('GaugeWorkingBalanceHelper-L1', 'mainnet', 17367389, function () {
    let workingBalanceHelper;
    let veDelegationProxy;
    let votingEscrow;
    let veBALHolder;
    let lpTokenHolder;
    let vault;
    let gauge;
    let lpToken;
    let BAL;
    let task;
    const VEBAL_POOL_ID = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
    const VAULT_BOUNTY = (0, numbers_1.fp)(1000);
    const LP_TOKEN = '0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2';
    const LP_TOKEN_HOLDER = '0x16224283bE3f7C0245d9D259Ea82eaD7fcB8343d';
    const GAUGE = '0x68d019f64a7aa97e2d4e7363aee42251d08124fb';
    const LOCK_PERIOD = time_1.MONTH * 12;
    before('run task', async () => {
        task = new _src_1.Task('20230526-gauge-working-balance-helper', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        workingBalanceHelper = await task.deployedInstance('GaugeWorkingBalanceHelper');
    });
    before('setup accounts', async () => {
        [, veBALHolder] = await (0, _src_1.getSigners)();
        veBALHolder = await (0, _src_1.impersonate)(veBALHolder.address, VAULT_BOUNTY.add((0, numbers_1.fp)(5))); // plus gas
        lpTokenHolder = await (0, _src_1.impersonate)(LP_TOKEN_HOLDER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        veDelegationProxy = await new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('VotingEscrowDelegationProxy');
        votingEscrow = await new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('VotingEscrow');
        const BALTokenAdmin = await new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('BalancerTokenAdmin');
        BAL = await BALTokenAdmin.getBalancerToken();
        const gaugeFactoryTask = new _src_1.Task('20220325-mainnet-gauge-factory', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gauge = await gaugeFactoryTask.instanceAt('LiquidityGaugeV5', GAUGE);
        lpToken = await (0, _src_1.instanceAt)('IERC20', LP_TOKEN);
    });
    before('stake in gauge', async () => {
        const stakeAmount = (0, numbers_1.fp)(100);
        await lpToken.connect(lpTokenHolder).transfer(veBALHolder.address, stakeAmount);
        await lpToken.connect(veBALHolder).approve(gauge.address, constants_1.MAX_UINT256);
        await gauge.connect(veBALHolder)['deposit(uint256)'](stakeAmount);
    });
    describe('getters', () => {
        it('stores the veDelegationProxy', async () => {
            (0, chai_1.expect)(await workingBalanceHelper.getVotingEscrowDelegationProxy()).to.equal(veDelegationProxy.address);
        });
        it('stores the votingEscrow', async () => {
            (0, chai_1.expect)(await workingBalanceHelper.getVotingEscrow()).to.equal(votingEscrow.address);
        });
        it('indicates where to read supply from', async () => {
            (0, chai_1.expect)(await workingBalanceHelper.readsTotalSupplyFromVE()).to.be.true;
        });
    });
    context('with no veBAL', () => {
        it('projected balance should equal current', async () => {
            const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
            // Ensure we have equal balances (that are non-zero)
            (0, chai_1.expect)(projectedWorkingBalance).to.eq(currentWorkingBalance);
            (0, chai_1.expect)(projectedWorkingBalance).to.gt(0);
        });
    });
    context('with veBAL', () => {
        before('create veBAL holder', async () => {
            const [poolAddress] = await vault.getPool(VEBAL_POOL_ID);
            const bal80weth20Pool = await (0, _src_1.instanceAt)('IERC20', poolAddress);
            await vault.connect(veBALHolder).joinPool(VEBAL_POOL_ID, veBALHolder.address, veBALHolder.address, {
                assets: [BAL, constants_1.ZERO_ADDRESS],
                maxAmountsIn: [0, VAULT_BOUNTY],
                fromInternalBalance: false,
                userData: encoder_1.WeightedPoolEncoder.joinExactTokensInForBPTOut([0, VAULT_BOUNTY], 0),
            }, { value: VAULT_BOUNTY });
            const holderBalance = await bal80weth20Pool.balanceOf(veBALHolder.address);
            await bal80weth20Pool.connect(veBALHolder).approve(votingEscrow.address, constants_1.MAX_UINT256);
            const currentTime = await (0, time_1.currentTimestamp)();
            await votingEscrow.connect(veBALHolder).create_lock(holderBalance, currentTime.add(LOCK_PERIOD));
        });
        it(`projected balance should be greater than current`, async () => {
            const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
            (0, chai_1.expect)(projectedWorkingBalance).to.be.gt(currentWorkingBalance);
        });
        it(`projected ratio should be greater than current`, async () => {
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
        context('decays after veBAL balance decays', () => {
            before(async () => {
                // Because the LP holder owns so few BPT tokens, they get a 2.5 boost even with just a little veBAL. So we don't
                // quite see the effect of the balance decay. We instead test for the extreme case when we're past the locktime,
                // at which point their veBAL balance is zero and there's no boost.
                // Another way of thinking about this is that they got much more veBAL than they needed for the 2.5 boost, so
                // even after it decays there's no real effect.
                await (0, time_1.advanceTime)(13 * time_1.MONTH);
            });
            it('projected balance should be less than current', async () => {
                const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
                (0, chai_1.expect)(projectedWorkingBalance).to.be.lt(currentWorkingBalance);
            });
            it('projected ratio should be less than current', async () => {
                const [currentWorkingRatio, projectedWorkingRatio] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(gauge.address, veBALHolder.address);
                (0, chai_1.expect)(projectedWorkingRatio).to.be.lt(currentWorkingRatio);
            });
        });
    });
});
