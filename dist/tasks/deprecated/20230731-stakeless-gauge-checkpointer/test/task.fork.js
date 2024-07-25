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
const numbers_1 = require("@helpers/numbers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
const time_1 = require("@helpers/time");
// This fork test verifies a corner case to validate the changes introduced in this checkpointer's version.
// The only gauge under test should have been checkpointed at this block.
// The contract in `20230527-l2-gauge-checkpointer` would skip it because it measures the gauge relative weight in
// the current week, whereas the new version does so in the previous week.
(0, _src_1.describeForkTest)('StakelessGaugeCheckpointer', 'mainnet', 17431930, function () {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    let GaugeType;
    (function (GaugeType) {
        GaugeType[GaugeType["Ethereum"] = 0] = "Ethereum";
        GaugeType[GaugeType["Polygon"] = 1] = "Polygon";
        GaugeType[GaugeType["Arbitrum"] = 2] = "Arbitrum";
        GaugeType[GaugeType["Optimism"] = 3] = "Optimism";
        GaugeType[GaugeType["Gnosis"] = 4] = "Gnosis";
        GaugeType[GaugeType["Avalanche"] = 5] = "Avalanche";
        GaugeType[GaugeType["PolygonZkEvm"] = 6] = "PolygonZkEvm";
        GaugeType[GaugeType["ZkSync"] = 7] = "ZkSync";
    })(GaugeType || (GaugeType = {}));
    let gaugeController;
    let stakelessGaugeCheckpointer;
    let authorizer, adaptorEntrypoint;
    let task;
    let daoMultisig, admin;
    const WEIGHT_THRESHOLD = (0, numbers_1.fp)(0.002); // 0.2%
    const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const CHECKPOINT_MULTISIG = '0x02f35dA6A02017154367Bc4d47bb6c7D06C7533B';
    const arbitrumRootGauge = '0xB5044FD339A7b858095324cC3F239C212956C179';
    const expectedCheckpoints = 8;
    const checkpointInterface = new hardhat_1.ethers.utils.Interface([
        'function checkpoint()',
        'event Checkpoint(uint256 indexed periodTime, uint256 periodEmissions)',
    ]);
    let gaugeData;
    before('run task', async () => {
        task = new _src_2.Task('20230731-stakeless-gauge-checkpointer', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        stakelessGaugeCheckpointer = await task.deployedInstance('StakelessGaugeCheckpointer');
    });
    before('setup governance', async () => {
        daoMultisig = await (0, _src_4.impersonate)(DAO_MULTISIG, (0, numbers_1.fp)(100));
        admin = await (0, _src_4.impersonate)(CHECKPOINT_MULTISIG, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        const authorizerTask = new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await authorizerTask.deployedInstance('Authorizer');
        const adaptorEntrypointTask = new _src_2.Task('20221124-authorizer-adaptor-entrypoint', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        adaptorEntrypoint = await adaptorEntrypointTask.deployedInstance('AuthorizerAdaptorEntrypoint');
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
    });
    before('add gauge to checkpointer', async () => {
        // This gauge was created by a previous factory, so we just add it via governance providing the right type.
        await authorizer
            .connect(daoMultisig)
            .grantRole(await (0, actions_1.actionId)(stakelessGaugeCheckpointer, 'addGaugesWithVerifiedType'), admin.address);
        await stakelessGaugeCheckpointer
            .connect(admin)
            .addGaugesWithVerifiedType(GaugeType[GaugeType.Arbitrum], [arbitrumRootGauge]);
    });
    before('grant checkpoint permission to gauge checkpointer', async () => {
        // Any gauge works; we just need the interface.
        const gauge = await task.instanceAt('IStakelessGauge', arbitrumRootGauge);
        await authorizer
            .connect(daoMultisig)
            .grantRole(await adaptorEntrypoint.getActionId(gauge.interface.getSighash('checkpoint')), stakelessGaugeCheckpointer.address);
    });
    before('check relative weight and store gauge data', async () => {
        // Here we verify that we are effectively testing a corner case, and that the gauge can still be checkpointed.
        // The gauge under test was created several weeks before the block specified in the fork test.
        // It meets 3 conditions, explained below.
        const currentWeek = await (0, time_1.currentWeekTimestamp)();
        const previousWeek = currentWeek.sub(time_1.WEEK);
        const relativeWeightPreviousWeek = await gaugeController['gauge_relative_weight(address,uint256)'](arbitrumRootGauge, previousWeek);
        // 1) The weight of the gauge in the previous week is non-zero, and greater than a given threshold.
        (0, chai_1.expect)(relativeWeightPreviousWeek).to.be.gte(WEIGHT_THRESHOLD);
        // 2) The gauge is not up to date in the controller.
        const latestCheckpointedTime = await gaugeController.time_weight(arbitrumRootGauge);
        (0, chai_1.expect)(latestCheckpointedTime).to.be.lt(currentWeek);
        // 3) The weight at the current week is 0.
        const relativeWeightNow = await gaugeController['gauge_relative_weight(address)'](arbitrumRootGauge);
        (0, chai_1.expect)(relativeWeightNow).to.be.eq(0);
        gaugeData = {
            address: arbitrumRootGauge,
            weight: relativeWeightPreviousWeek,
            expectedCheckpoints,
        };
    });
    it('checks that gauges were added correctly', async () => {
        (0, chai_1.expect)(await stakelessGaugeCheckpointer.getTotalGauges(GaugeType[GaugeType.Arbitrum])).to.be.eq(1);
    });
    describe('checkpoint', () => {
        sharedBeforeEach(async () => {
            // Gauges that are above a threshold will get another checkpoint attempt when the threshold is lowered.
            // This block takes a snapshot so that gauges can be repeatedly checkpointed without skipping.
        });
        context('when threshold is above gauge weight', () => {
            const minRelativeWeight = WEIGHT_THRESHOLD.mul(10);
            it('skips the gauge', async () => {
                const tx = await stakelessGaugeCheckpointer.checkpointGaugesAboveRelativeWeight(minRelativeWeight, {
                    value: await stakelessGaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
                });
                expectEvent.notEmitted(await tx.wait(), 'Checkpoint');
            });
        });
        context('when threshold below gauge weight', () => {
            const minRelativeWeight = WEIGHT_THRESHOLD;
            it('performs the checkpoint', async () => {
                const tx = await stakelessGaugeCheckpointer.checkpointGaugesAboveRelativeWeight(minRelativeWeight, {
                    value: await stakelessGaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
                });
                expectEvent.inIndirectReceipt(await tx.wait(), checkpointInterface, 'Checkpoint', {}, gaugeData.address, gaugeData.expectedCheckpoints);
            });
        });
    });
});
