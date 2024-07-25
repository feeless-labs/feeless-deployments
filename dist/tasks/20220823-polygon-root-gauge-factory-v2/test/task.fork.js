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
const expectTransfer_1 = require("@helpers/expectTransfer");
const relativeError_1 = require("@helpers/relativeError");
const constants_1 = require("@helpers/constants");
const actions_1 = require("@helpers/models/misc/actions");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('PolygonRootGaugeFactoryV2', 'mainnet', 15397200, function () {
    let veBALHolder, admin, recipient;
    let factory, gauge;
    let vault, authorizer, authorizerAdaptor, BALTokenAdmin, gaugeController, gaugeAdder;
    let BAL;
    let task;
    const VEBAL_HOLDER = '0xd519D5704B41511951C8CF9f65Fee9AB9beF2611';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const weightCap = (0, numbers_1.fp)(0.001);
    before('run task', async () => {
        task = new _src_1.Task('20220823-polygon-root-gauge-factory-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('PolygonRootGaugeFactory');
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
        vault = await vaultTask.instanceAt('Vault', vaultTask.output({ network: 'mainnet' }).Vault);
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.instanceAt('AuthorizerAdaptor', authorizerAdaptorTask.output({ network: 'mainnet' }).AuthorizerAdaptor);
        const gaugeAdderTask = new _src_1.Task('20220628-gauge-adder-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeAdder = await gaugeAdderTask.instanceAt('GaugeAdder', gaugeAdderTask.output({ network: 'mainnet' }).GaugeAdder);
        const balancerTokenAdminTask = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        BALTokenAdmin = await balancerTokenAdminTask.instanceAt('BalancerTokenAdmin', balancerTokenAdminTask.output({ network: 'mainnet' }).BalancerTokenAdmin);
        BAL = await BALTokenAdmin.getBalancerToken();
        const gaugeControllerTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.instanceAt('GaugeController', gaugeControllerTask.output({ network: 'mainnet' }).GaugeController);
    });
    it('create gauge', async () => {
        const tx = await factory.create(recipient.address, weightCap);
        const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
        gauge = await task.instanceAt('PolygonRootGauge', event.args.gauge);
        (0, chai_1.expect)(await factory.isGaugeFromFactory(gauge.address)).to.be.true;
    });
    it('grant permissions', async () => {
        // We need to grant permission to the admin to add the Polygon factory to the GaugeAdder, and also to then add
        // gauges from said factory to the GaugeController.
        const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        await Promise.all(['addGaugeFactory', 'addPolygonGauge'].map(async (method) => await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(gaugeAdder, method), admin.address)));
        // We also need to grant permissions to mint in the gauges, which is done via the Authorizer Adaptor
        await authorizer
            .connect(govMultisig)
            .grantRole(await authorizerAdaptor.getActionId(gauge.interface.getSighash('checkpoint')), admin.address);
    });
    it('add gauge to gauge controller', async () => {
        await gaugeAdder.connect(admin).addGaugeFactory(factory.address, 3); // Polygon is Gauge Type 3
        await gaugeAdder.connect(admin).addPolygonGauge(gauge.address);
        (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
    });
    it('vote for gauge', async () => {
        (0, chai_1.expect)(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
        (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(0);
        await gaugeController.connect(veBALHolder).vote_for_gauge_weights(gauge.address, 10000); // Max voting power is 10k points
        // We now need to go through an epoch for the votes to be locked in
        await (0, time_1.advanceTime)(time_1.DAY * 8);
        await gaugeController.checkpoint();
        // Gauge weight is equal to the cap, and controller weight for the gauge is greater than the cap.
        (0, chai_1.expect)(await gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, await (0, time_1.currentWeekTimestamp)())).to.be.gt(weightCap);
        (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(weightCap);
    });
    it('mint & bridge tokens', async () => {
        // The gauge has votes for this week, and it will mint the first batch of tokens. We store the current gauge
        // relative weight, as it will change as time goes by due to vote decay.
        const firstMintWeekTimestamp = await (0, time_1.currentWeekTimestamp)();
        const calldata = gauge.interface.encodeFunctionData('checkpoint');
        // Even though the gauge has relative weight, it cannot mint yet as it needs for the epoch to finish
        const zeroMintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        expectEvent.inIndirectReceipt(await zeroMintTx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: firstMintWeekTimestamp.sub(time_1.WEEK),
            periodEmissions: 0,
        });
        // No token transfers are performed if the emissions are zero, but we can't test for a lack of those
        await (0, time_1.advanceTime)(time_1.WEEK);
        // The gauge should now mint and send all minted tokens to the Polygon bridge
        const mintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        const event = expectEvent.inIndirectReceipt(await mintTx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: firstMintWeekTimestamp,
        });
        const actualEmissions = event.args.periodEmissions;
        // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
        const expectedEmissions = weightCap.mul(weeklyRate).div(numbers_1.FP_ONE);
        (0, relativeError_1.expectEqualWithError)(actualEmissions, expectedEmissions, 0.001);
        // Tokens are minted for the gauge
        (0, expectTransfer_1.expectTransferEvent)(await mintTx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: gauge.address,
            value: actualEmissions,
        }, BAL);
        // And the gauge then deposits those in the predicate via the bridge mechanism
        const bridgeInterface = new hardhat_1.ethers.utils.Interface([
            'event LockedERC20(address indexed depositor, address indexed depositReceiver, address indexed rootToken, uint256 amount)',
        ]);
        expectEvent.inIndirectReceipt(await mintTx.wait(), bridgeInterface, 'LockedERC20', {
            depositor: gauge.address,
            depositReceiver: recipient.address,
            rootToken: BAL,
            amount: actualEmissions,
        });
    });
    it('mint multiple weeks', async () => {
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
        // The amount of tokens minted should equal the sum of the weekly emissions rate times the relative weight of the
        // gauge (this assumes we're not crossing an emissions rate epoch so that the inflation remains constant).
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
        const expectedEmissions = weightCap.mul(numberOfWeeks).mul(weeklyRate).div(numbers_1.FP_ONE);
        const calldata = gauge.interface.encodeFunctionData('checkpoint');
        const tx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => expectEvent.inIndirectReceipt(await tx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: weekTimestamp.sub(time_1.WEEK * weekIndex),
        })));
        // Tokens are minted for the gauge
        const transferEvent = (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: gauge.address,
        }, BAL);
        (0, chai_1.expect)(transferEvent.args.value).to.be.almostEqual(expectedEmissions);
        // And the gauge then deposits those in the predicate via the bridge mechanism
        const bridgeInterface = new hardhat_1.ethers.utils.Interface([
            'event LockedERC20(address indexed depositor, address indexed depositReceiver, address indexed rootToken, uint256 amount)',
        ]);
        const depositEvent = expectEvent.inIndirectReceipt(await tx.wait(), bridgeInterface, 'LockedERC20', {
            depositor: gauge.address,
            depositReceiver: recipient.address,
            rootToken: BAL,
        });
        (0, chai_1.expect)(depositEvent.args.amount).to.be.almostEqual(expectedEmissions);
    });
});
