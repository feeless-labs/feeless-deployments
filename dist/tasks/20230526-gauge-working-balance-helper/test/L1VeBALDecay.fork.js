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
const _src_1 = require("@src");
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
(0, _src_1.describeForkTest)('GaugeWorkingBalanceHelper-L1-TimeDecay', 'mainnet', 17367389, function () {
    let workingBalanceHelper;
    let veDelegationProxy;
    let votingEscrow;
    let veBALHolder;
    let lpTokenHolder;
    let other;
    let vault;
    let gauge;
    let lpToken;
    let BAL;
    let task;
    const VEBAL_POOL_ID = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
    const VAULT_BOUNTY = (0, numbers_1.fp)(1000);
    const LP_TOKEN = '0xbc5F4f9332d8415AAf31180Ab4661c9141CC84E4';
    const LP_TOKEN_HOLDER = '0x24Dd242c3c4061b1fCaA5119af608B56afBaEA95';
    const LOCK_PERIOD = time_1.MONTH * 12;
    before('run task', async () => {
        task = new _src_1.Task('20230526-gauge-working-balance-helper', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        workingBalanceHelper = await task.deployedInstance('GaugeWorkingBalanceHelper');
    });
    before('setup accounts', async () => {
        [, veBALHolder, other] = await (0, _src_1.getSigners)();
        veBALHolder = await (0, _src_1.impersonate)(veBALHolder.address, VAULT_BOUNTY.add((0, numbers_1.fp)(5))); // plus gas
        lpTokenHolder = await (0, _src_1.impersonate)(LP_TOKEN_HOLDER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        veDelegationProxy = await new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('VotingEscrowDelegationProxy');
        votingEscrow = await new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('VotingEscrow');
        const BALTokenAdmin = await new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('BalancerTokenAdmin');
        BAL = await BALTokenAdmin.getBalancerToken();
        lpToken = await (0, _src_1.instanceAt)('IERC20', LP_TOKEN);
    });
    before('create gauge', async () => {
        const gaugeFactoryTask = new _src_1.Task('20220822-mainnet-gauge-factory-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        const factory = await gaugeFactoryTask.deployedInstance('LiquidityGaugeFactory');
        const weightCap = (0, numbers_1.fp)(0.001);
        // Create the Gauge, vs using an existing one, so that we can control the total balance
        const tx = await factory.create(LP_TOKEN, weightCap);
        const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
        gauge = await gaugeFactoryTask.instanceAt('LiquidityGaugeV5', event.args.gauge);
        (0, chai_1.expect)(await gauge.lp_token()).to.equal(LP_TOKEN);
        (0, chai_1.expect)(await factory.isGaugeFromFactory(gauge.address)).to.be.true;
    });
    const stakeAmount = (0, numbers_1.fp)(100);
    before('stake in gauge', async () => {
        await lpToken.connect(lpTokenHolder).transfer(veBALHolder.address, stakeAmount);
        await lpToken.connect(lpTokenHolder).transfer(other.address, stakeAmount);
        await lpToken.connect(lpTokenHolder).approve(gauge.address, constants_1.MAX_UINT256);
        await lpToken.connect(veBALHolder).approve(gauge.address, constants_1.MAX_UINT256);
        await lpToken.connect(other).approve(gauge.address, constants_1.MAX_UINT256);
        await gauge.connect(lpTokenHolder)['deposit(uint256)'](stakeAmount.mul(100));
        await gauge.connect(veBALHolder)['deposit(uint256)'](stakeAmount);
        await gauge.connect(other)['deposit(uint256)'](stakeAmount);
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
    it('projected balance should equal current', async () => {
        const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(gauge.address, veBALHolder.address);
        // Ensure we have equal balances (that are non-zero)
        (0, chai_1.expect)(projectedWorkingBalance).to.eq(currentWorkingBalance);
        (0, chai_1.expect)(projectedWorkingBalance).to.gt(0);
    });
    context('with veBAL', () => {
        let bal80weth20Pool;
        let whaleBalance;
        before('create veBAL whale', async () => {
            const [poolAddress] = await vault.getPool(VEBAL_POOL_ID);
            bal80weth20Pool = await (0, _src_1.instanceAt)('IERC20', poolAddress);
            await vault.connect(veBALHolder).joinPool(VEBAL_POOL_ID, veBALHolder.address, veBALHolder.address, {
                assets: [BAL, constants_1.ZERO_ADDRESS],
                maxAmountsIn: [0, VAULT_BOUNTY],
                fromInternalBalance: false,
                userData: encoder_1.WeightedPoolEncoder.joinExactTokensInForBPTOut([0, VAULT_BOUNTY], 0),
            }, { value: VAULT_BOUNTY });
            const totalBalance = await bal80weth20Pool.balanceOf(veBALHolder.address);
            whaleBalance = (0, numbers_1.fpMul)(totalBalance, (0, numbers_1.fp)(0.99));
            const otherBalance = totalBalance.sub(whaleBalance);
            await bal80weth20Pool.connect(veBALHolder).transfer(other.address, otherBalance);
            await bal80weth20Pool.connect(veBALHolder).approve(votingEscrow.address, constants_1.MAX_UINT256);
            await bal80weth20Pool.connect(other).approve(votingEscrow.address, constants_1.MAX_UINT256);
            const currentTime = await (0, time_1.currentTimestamp)();
            await votingEscrow.connect(other).create_lock(otherBalance, currentTime.add(LOCK_PERIOD));
        });
        it('veBAL share size affects projected balances', async () => {
            const [, projectedBalanceBefore] = await workingBalanceHelper.getWorkingBalances(gauge.address, other.address);
            const [, projectedRatioBefore] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(gauge.address, other.address);
            await gauge.connect(other).user_checkpoint(other.address);
            await workingBalanceHelper.getWorkingBalances(gauge.address, other.address);
            // Dilute other's share
            await votingEscrow.connect(veBALHolder).create_lock(whaleBalance, (await (0, time_1.currentTimestamp)()).add(LOCK_PERIOD));
            const [currentBalanceAfter, projectedBalanceAfter] = await workingBalanceHelper.getWorkingBalances(gauge.address, other.address);
            const [, projectedRatioAfter] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(gauge.address, other.address);
            // Projections should be uniformly lower
            (0, chai_1.expect)(projectedBalanceAfter).to.be.lt(projectedBalanceBefore);
            (0, chai_1.expect)(projectedRatioAfter).to.be.lt(projectedRatioBefore);
            // Should be close a week after checkpointing
            (0, chai_1.expect)(currentBalanceAfter).to.be.almostEqual(projectedBalanceBefore);
        });
    });
});
