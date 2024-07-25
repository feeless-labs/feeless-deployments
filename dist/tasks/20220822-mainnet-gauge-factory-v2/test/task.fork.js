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
const numbers_1 = require("@helpers/numbers");
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const relativeError_1 = require("@helpers/relativeError");
const expectTransfer_1 = require("@helpers/expectTransfer");
const constants_1 = require("@helpers/constants");
const lodash_1 = require("lodash");
const actions_1 = require("@helpers/models/misc/actions");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('LiquidityGaugeFactoryV2', 'mainnet', 15397200, function () {
    let veBALHolder, admin, lpTokenHolder;
    let factory, gauge;
    let vault, authorizer, BALTokenAdmin, gaugeController, gaugeAdder, lpToken, balancerMinter;
    let BAL;
    let task;
    const VEBAL_HOLDER = '0xd519D5704B41511951C8CF9f65Fee9AB9beF2611';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const LP_TOKEN = '0xbc5F4f9332d8415AAf31180Ab4661c9141CC84E4';
    const LP_TOKEN_HOLDER = '0x24Dd242c3c4061b1fCaA5119af608B56afBaEA95';
    const weightCap = (0, numbers_1.fp)(0.001);
    before('run task', async () => {
        task = new _src_1.Task('20220822-mainnet-gauge-factory-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('LiquidityGaugeFactory');
    });
    before('advance time', async () => {
        // This causes all voting cooldowns to expire, letting the veBAL holder vote again
        await (0, time_1.advanceTime)(time_1.DAY * 12);
    });
    before('setup accounts', async () => {
        admin = await (0, _src_1.getSigner)(0);
        veBALHolder = await (0, _src_1.impersonate)(VEBAL_HOLDER);
        lpTokenHolder = await (0, _src_1.impersonate)(LP_TOKEN_HOLDER);
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', vaultTask.output({ network: 'mainnet' }).Vault);
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const gaugeAdderTask = new _src_1.Task('20220628-gauge-adder-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeAdder = await gaugeAdderTask.instanceAt('GaugeAdder', gaugeAdderTask.output({ network: 'mainnet' }).GaugeAdder);
        const balancerTokenAdminTask = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        BALTokenAdmin = await balancerTokenAdminTask.instanceAt('BalancerTokenAdmin', balancerTokenAdminTask.output({ network: 'mainnet' }).BalancerTokenAdmin);
        BAL = await BALTokenAdmin.getBalancerToken();
        const gaugeControllerTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.instanceAt('GaugeController', gaugeControllerTask.output({ network: 'mainnet' }).GaugeController);
        balancerMinter = await gaugeControllerTask.instanceAt('BalancerMinter', gaugeControllerTask.output({ network: 'mainnet' }).BalancerMinter);
        // We use test balancer token to make use of the ERC-20 interface.
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        lpToken = await testBALTokenTask.instanceAt('TestBalancerToken', LP_TOKEN);
    });
    it('create gauge', async () => {
        const tx = await factory.create(LP_TOKEN, weightCap);
        const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
        gauge = await task.instanceAt('LiquidityGaugeV5', event.args.gauge);
        (0, chai_1.expect)(await gauge.lp_token()).to.equal(LP_TOKEN);
        (0, chai_1.expect)(await factory.isGaugeFromFactory(gauge.address)).to.be.true;
    });
    it('grant permissions', async () => {
        // We need to grant permission to the admin to add the LiquidityGaugeFactory to the GaugeAdder, and also to add
        // gauges from said factory to the GaugeController.
        const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        await Promise.all(['addGaugeFactory', 'addEthereumGauge'].map(async (method) => await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(gaugeAdder, method), admin.address)));
    });
    it('add gauge to gauge controller', async () => {
        await gaugeAdder.connect(admin).addGaugeFactory(factory.address, 2); // Ethereum is type 2.
        await gaugeAdder.connect(admin).addEthereumGauge(gauge.address);
        (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
    });
    it('stake LP tokens in gauge', async () => {
        await lpToken.connect(lpTokenHolder).approve(gauge.address, constants_1.MAX_UINT256);
        await gauge.connect(lpTokenHolder)['deposit(uint256)'](await lpToken.balanceOf(lpTokenHolder.address));
    });
    it('vote for gauge so that weight is above cap', async () => {
        (0, chai_1.expect)(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
        (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(0);
        // Max voting power is 10k points
        await gaugeController.connect(veBALHolder).vote_for_gauge_weights(gauge.address, 10000);
        // We now need to go through an epoch for the votes to be locked in
        await (0, time_1.advanceTime)(time_1.DAY * 8);
        await gaugeController.checkpoint();
        // Gauge weight is equal to the cap, and controller weight for the gauge is greater than the cap.
        (0, chai_1.expect)(await gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, await (0, time_1.currentWeekTimestamp)())).to.be.gt(weightCap);
        (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(weightCap);
    });
    it('mint & bridge tokens', async () => {
        // For simplicty, we're going to move to the end of the week so that we mint a full week's worth of tokens.
        const firstMintWeekTimestamp = await (0, time_1.currentWeekTimestamp)();
        await (0, time_1.advanceToTimestamp)(firstMintWeekTimestamp.add(time_1.WEEK));
        const tx = await balancerMinter.connect(lpTokenHolder).mint(gauge.address);
        const event = (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: lpTokenHolder.address,
        }, BAL);
        // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge.
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        // Note that we use the cap instead of the weight, since we're testing a scenario in which the weight is larger than
        // the cap.
        const expectedGaugeEmissions = weeklyRate.mul(weightCap).div((0, numbers_1.fp)(1));
        // Since the LP token holder is the only account staking in the gauge, they'll receive the full amount destined to
        // the gauge.
        const actualEmissions = event.args.value;
        (0, relativeError_1.expectEqualWithError)(actualEmissions, expectedGaugeEmissions, 0.001);
    });
    it('mint multiple weeks', async () => {
        // Since we're at the beginning of a week, we can simply advance a whole number of weeks for them to be complete.
        const numberOfWeeks = 5;
        await (0, time_1.advanceTime)(time_1.WEEK * numberOfWeeks);
        await gaugeController.checkpoint_gauge(gauge.address);
        const weekTimestamp = await (0, time_1.currentWeekTimestamp)();
        // We can query the relative weight of the gauge for each of the weeks that have passed
        const relativeWeights = await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, weekTimestamp.sub(time_1.WEEK * weekIndex))));
        // We require that they're all above the cap for simplicity - this lets us use the cap as each week's weight (and
        // also tests cap behavior).
        for (const relativeWeight of relativeWeights) {
            (0, chai_1.expect)(relativeWeight).to.be.gt(weightCap);
        }
        const tx = await balancerMinter.connect(lpTokenHolder).mint(gauge.address);
        const event = (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: lpTokenHolder.address,
        }, BAL);
        // The amount of tokens allocated to the gauge should equal the sum of the weekly emissions rate times the weight
        // cap.
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        const expectedGaugeEmissions = weeklyRate.mul(numberOfWeeks).mul(weightCap).div((0, numbers_1.fp)(1));
        // Since the LP token holder is the only account staking in the gauge, they'll receive the full amount destined to
        // the gauge.
        const actualEmissions = event.args.value;
        (0, relativeError_1.expectEqualWithError)(actualEmissions, expectedGaugeEmissions, 0.001);
    });
});
