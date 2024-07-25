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
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importStar(require("hardhat"));
const chai_1 = require("chai");
const lodash_1 = require("lodash");
const numbers_1 = require("@helpers/numbers");
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const relativeError_1 = require("@helpers/relativeError");
const constants_1 = require("@helpers/constants");
const expectTransfer_1 = require("@helpers/expectTransfer");
const _src_1 = require("@src");
// We currently do not have a GaugeAdder which supports deploying gauges with a type of "Optimism".
// We then place the gauge deployed for this test into the "Arbitrum" type.
// In production a proper gauge type should be created for the gauges deployed by this factory.
(0, _src_1.describeForkTest)('OptimismRootGaugeFactory', 'mainnet', 14850000, function () {
    let veBALHolder, admin, recipient;
    let factory, gauge;
    let vault, authorizer, authorizerAdaptor, BALTokenAdmin, gaugeController, gaugeAdder;
    let BAL;
    let task;
    let OptimismBAL;
    const VEBAL_HOLDER = '0xCB3593C7c0dFe13129Ff2B6add9bA402f76c797e';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_1.Task('20220628-optimism-root-gauge-factory', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        ({ OptimismBAL } = task.input());
        await task.run({ force: true });
        factory = await task.deployedInstance('OptimismRootGaugeFactory');
    });
    before('advance time', async () => {
        // This causes all voting cooldowns to expire, letting the veBAL holder vote again
        await (0, time_1.advanceTime)(time_1.DAY * 12);
    });
    before('setup accounts', async () => {
        admin = await (0, _src_1.getSigner)(0);
        recipient = await (0, _src_1.getSigner)(1);
        veBALHolder = await (0, _src_1.impersonate)(VEBAL_HOLDER);
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const gaugeAdderTask = new _src_1.Task('20220325-gauge-adder', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeAdder = await gaugeAdderTask.deployedInstance('GaugeAdder');
        const balancerTokenAdminTask = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        BALTokenAdmin = await balancerTokenAdminTask.deployedInstance('BalancerTokenAdmin');
        BAL = await BALTokenAdmin.getBalancerToken();
        const gaugeControllerTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
        // Remove the existing vote to free up some voting power.
        await gaugeController.connect(veBALHolder).vote_for_gauge_weights('0xE867AD0a48e8f815DC0cda2CDb275e0F163A480b', 0);
    });
    it('create gauge', async () => {
        const tx = await factory.create(recipient.address);
        const event = expectEvent.inReceipt(await tx.wait(), 'OptimismRootGaugeCreated');
        gauge = await task.instanceAt('OptimismRootGauge', event.args.gauge);
        (0, chai_1.expect)(event.args.recipient).to.equal(recipient.address);
        (0, chai_1.expect)(await factory.isGaugeFromFactory(gauge.address)).to.be.true;
        (0, chai_1.expect)(await factory.getRecipientGauge(recipient.address)).to.equal(gauge.address);
        (0, chai_1.expect)(await factory.getGaugeRecipient(gauge.address)).to.equal(recipient.address);
    });
    it('grant permissions', async () => {
        // We need to grant permission to the admin to add the Optimism factory to the GaugeAdder, and also to then add
        // gauges from said factory to the GaugeController.
        const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        const selectors = ['addGaugeFactory', 'addArbitrumGauge'].map((method) => gaugeAdder.interface.getSighash(method));
        await Promise.all(selectors.map(async (selector) => await authorizer.connect(govMultisig).grantRole(await gaugeAdder.getActionId(selector), admin.address)));
        // We also need to grant permissions to mint in the gauges, which is done via the Authorizer Adaptor
        await authorizer
            .connect(govMultisig)
            .grantRole(await authorizerAdaptor.getActionId(gauge.interface.getSighash('checkpoint')), admin.address);
    });
    it('add gauge to gauge controller', async () => {
        await gaugeAdder.addGaugeFactory(factory.address, 4); // Arbitrum is Gauge Type 4
        await gaugeAdder.addArbitrumGauge(gauge.address);
        (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
    });
    it('vote for gauge', async () => {
        (0, chai_1.expect)(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
        await gaugeController.connect(veBALHolder).vote_for_gauge_weights(gauge.address, 10000); // Max voting power is 10k points
        // We now need to go through an epoch for the votes to be locked in
        await (0, time_1.advanceTime)(time_1.DAY * 8);
        await gaugeController.checkpoint();
        (0, chai_1.expect)(await gaugeController['gauge_relative_weight(address)'](gauge.address)).to.be.gt(0);
    });
    it('mint & bridge tokens', async () => {
        // The gauge has votes for this week, and it will mint the first batch of tokens. We store the current gauge
        // relative weight, as it will change as time goes by due to vote decay.
        const firstMintWeekTimestamp = await (0, time_1.currentWeekTimestamp)();
        const gaugeRelativeWeight = await gaugeController['gauge_relative_weight(address)'](gauge.address);
        const calldata = gauge.interface.encodeFunctionData('checkpoint');
        // Even though the gauge has relative weight, it cannot mint yet as it needs for the epoch to finish
        const zeroMintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        expectEvent.inIndirectReceipt(await zeroMintTx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: firstMintWeekTimestamp.sub(time_1.WEEK),
            periodEmissions: 0,
        });
        // No token transfers are performed if the emissions are zero, but we can't test for a lack of those
        await (0, time_1.advanceTime)(time_1.WEEK);
        // The gauge should now mint and send all minted tokens to the Arbitrum bridge
        const mintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        const event = expectEvent.inIndirectReceipt(await mintTx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: firstMintWeekTimestamp,
        });
        const actualEmissions = event.args.periodEmissions;
        // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        const expectedEmissions = gaugeRelativeWeight.mul(weeklyRate).div(numbers_1.FP_ONE);
        (0, relativeError_1.expectEqualWithError)(actualEmissions, expectedEmissions, 0.001);
        // Tokens are minted for the gauge
        (0, expectTransfer_1.expectTransferEvent)(await mintTx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: gauge.address,
            value: actualEmissions,
        }, BAL);
        // And the gauge then deposits those in the predicate via the bridge mechanism
        const bridgeInterface = new hardhat_1.ethers.utils.Interface([
            'event ERC20DepositInitiated(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)',
        ]);
        expectEvent.inIndirectReceipt(await mintTx.wait(), bridgeInterface, 'ERC20DepositInitiated', {
            _l1Token: BAL,
            _l2Token: OptimismBAL,
            _from: gauge.address,
            _to: recipient.address,
            _amount: actualEmissions,
        });
    });
    it('mint multiple weeks', async () => {
        const numberOfWeeks = 5;
        await (0, time_1.advanceTime)(time_1.WEEK * numberOfWeeks);
        await gaugeController.checkpoint_gauge(gauge.address);
        const weekTimestamp = await (0, time_1.currentWeekTimestamp)();
        // We can query the relative weight of the gauge for each of the weeks that have passed
        const relativeWeights = await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, weekTimestamp.sub(time_1.WEEK * weekIndex))));
        // The amount of tokens minted should equal the sum of the weekly emissions rate times the relative weight of the
        // gauge (this assumes we're not crossing an emissions rate epoch so that the inflation remains constant).
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        const expectedEmissions = relativeWeights
            .map((weight) => weight.mul(weeklyRate).div(numbers_1.FP_ONE))
            .reduce((sum, value) => sum.add(value));
        const calldata = gauge.interface.encodeFunctionData('checkpoint');
        const tx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => expectEvent.inIndirectReceipt(await tx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: weekTimestamp.sub(time_1.WEEK * weekIndex),
        })));
        // Tokens are minted for the gauge
        (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: gauge.address,
            value: expectedEmissions,
        }, BAL);
        // And the gauge then deposits those in the predicate via the bridge mechanism
        const bridgeInterface = new hardhat_1.ethers.utils.Interface([
            'event ERC20DepositInitiated(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)',
        ]);
        expectEvent.inIndirectReceipt(await tx.wait(), bridgeInterface, 'ERC20DepositInitiated', {
            _l1Token: BAL,
            _l2Token: OptimismBAL,
            _from: gauge.address,
            _to: recipient.address,
            _amount: expectedEmissions,
        });
    });
});
