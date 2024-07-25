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
// This block number is before the manual weekly checkpoint. This ensures gauges will actually be checkpointed.
// This test verifies the checkpointer against the manual transactions for the given period.
(0, _src_1.describeForkTest)('L2GaugeCheckpointer', 'mainnet', 17332499, function () {
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
    let adderCoordinator;
    let L2GaugeCheckpointer;
    let authorizer, adaptorEntrypoint;
    let task;
    let daoMultisig, admin;
    const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const CHECKPOINT_MULTISIG = '0x02f35dA6A02017154367Bc4d47bb6c7D06C7533B';
    // Event we are looking for is:
    // Checkpoint(uint256,uint256)
    // Topic: 0x21d81d5d656869e8ce3ba8d65526a2f0dbbcd3d36f5f9999eb7c84360e45eced
    // See tx: 0x617b441cac07386a37513dfdf351821793d795b3beb1aab1d71dad1bc69a7c86
    // Search for the topic in the given TX.
    // The total expected checkpoints is the amount of checkpoints in the TX + 1 (see Arbitrum gauges below).
    const TOTAL_EXPECTED_CHECKPOINTS = 79;
    // Gauges that are NOT killed for the given test block number.
    const polygonRootGauges = [
        ['0x082aacfaf4db8ac0642cbed50df732d3c309e679', 6],
        ['0xdd3b4161d2a4c609884e20ed71b4e85be44572e6', 6],
        ['0x16289f675ca54312a8fcf99341e7439982888077', 6],
        ['0x455f20c54b5712a84454468c7831f7c431aeeb1c', 6],
        ['0x39ceebb561a65216a4b776ea752d3137e9d6c0f0', 6],
        ['0x1604b7e80975555e0aceaca9c81807fbb4d65cf1', 6],
        ['0xc534c30749b6c198d35a7836e26076e7745d8936', 6],
        ['0x539d6edbd16f2f069a06716416c3a6e98cc29dd0', 5],
        ['0x31f99c542cbe456fcbbe99d4bf849af4d7fb5405', 6],
        ['0x47d7269829ba9571d98eb6ddc34e9c8f1a4c327f', 6],
        ['0x416d15c36c6daad2b9410b79ae557e6f07dcb642', 1],
        ['0xd103dd49b8051a09b399a52e9a8ab629392de2fb', 1],
    ];
    // There were no Arbitrum checkpoints in this TX, but this gauge was not killed the previous week unlike the rest
    // of the Arbitrum gauges, so it can be checkpointed.
    // It is important to have at least one Arbitrum gauge for the test, because it is the only type that has
    // an associated ETH fee.
    const arbitrumRootGauges = [
        ['0x8204b749b808818deb7957dbd030ceea44d1fe18', 1],
    ];
    const optimismRootGauges = [
        ['0xdacd99029b4b94cd04fe364aac370829621c1c64', 6],
    ];
    const gnosisRootGauges = [
        ['0xe41736b4e78be41bd03ebaf8f86ea493c6e9ea96', 1],
        ['0x21b2ef3dc22b7bd4634205081c667e39742075e2', 1],
        ['0x3b6a85b5e1e6205ebf4d4eabf147d10e8e4bf0a5', 1],
        ['0xcb2c2af6c3e88b4a89aa2aae1d7c8120eee9ad0e', 6],
    ];
    const singleRecipientGauges = [
        ['0x56124eb16441A1eF12A4CCAeAbDD3421281b795A', 1],
        ['0xE867AD0a48e8f815DC0cda2CDb275e0F163A480b', 1],
    ];
    const checkpointInterface = new hardhat_1.ethers.utils.Interface([
        'function checkpoint()',
        'event Checkpoint(uint256 indexed periodTime, uint256 periodEmissions)',
    ]);
    const gauges = new Map();
    before('run task', async () => {
        task = new _src_2.Task('20230527-l2-gauge-checkpointer', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        L2GaugeCheckpointer = await task.deployedInstance('L2GaugeCheckpointer');
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
    });
    // At this block, the adder coordinator has been deployed but not executed.
    // Then, we can fetch the deployed contract and execute it here to setup the correct types in the adder, which are
    // necessary for the checkpointer to work correctly.
    before('run adder migrator coordinator', async () => {
        const adderCoordinatorTask = new _src_2.Task('20230519-gauge-adder-migration-v3-to-v4', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        adderCoordinator = await adderCoordinatorTask.deployedInstance('GaugeAdderMigrationCoordinator');
        await authorizer.connect(daoMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), adderCoordinator.address);
        await adderCoordinator.performNextStage();
    });
    before('get gauge relative weights and associate them with their respective address', async () => {
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
        const getGaugesData = async (gaugeInputs) => {
            return Promise.all(gaugeInputs.map(async (gaugeInput) => {
                return {
                    address: gaugeInput[0],
                    weight: await gaugeController['gauge_relative_weight(address)'](gaugeInput[0]),
                    expectedCheckpoints: gaugeInput[1],
                };
            }));
        };
        const singleRecipientGaugesData = await getGaugesData(singleRecipientGauges);
        const polygonRootGaugesData = await getGaugesData(polygonRootGauges);
        const arbitrumRootGaugesData = await getGaugesData(arbitrumRootGauges);
        const optimismRootGaugesData = await getGaugesData(optimismRootGauges);
        const gnosisRootGaugesData = await getGaugesData(gnosisRootGauges);
        gauges.set(GaugeType.Ethereum, singleRecipientGaugesData);
        gauges.set(GaugeType.Polygon, polygonRootGaugesData);
        gauges.set(GaugeType.Arbitrum, arbitrumRootGaugesData);
        gauges.set(GaugeType.Optimism, optimismRootGaugesData);
        gauges.set(GaugeType.Gnosis, gnosisRootGaugesData);
    });
    before('check total expected checkpoints', () => {
        let sum = 0;
        for (const [, gaugeData] of gauges.entries()) {
            if (gaugeData.length > 0) {
                sum += gaugeData.map((gaugeData) => gaugeData.expectedCheckpoints).reduce((a, b) => a + b);
            }
        }
        (0, chai_1.expect)(sum).to.be.eq(TOTAL_EXPECTED_CHECKPOINTS);
    });
    before('add gauges to checkpointer', async () => {
        // Some gauges were created from previous factories, so they need to be added by governance.
        // For simplicity, we just add all of them with the same method.
        // The non-permissioned 'addGauges' function is already tested in the unit test.
        await authorizer
            .connect(daoMultisig)
            .grantRole(await (0, actions_1.actionId)(L2GaugeCheckpointer, 'addGaugesWithVerifiedType'), admin.address);
        await Promise.all(Array.from(gauges).map(([gaugeType, gaugesData]) => {
            L2GaugeCheckpointer.connect(admin).addGaugesWithVerifiedType(GaugeType[gaugeType], gaugesData.map((gaugeData) => gaugeData.address));
        }));
    });
    before('grant checkpoint permission to gauge checkpointer', async () => {
        // Any gauge works; we just need the interface.
        const gauge = await task.instanceAt('IStakelessGauge', gauges.get(GaugeType.Polygon)[0].address);
        await authorizer
            .connect(daoMultisig)
            .grantRole(await adaptorEntrypoint.getActionId(gauge.interface.getSighash('checkpoint')), L2GaugeCheckpointer.address);
    });
    it('checks that gauges were added correctly', async () => {
        for (const [gaugeType, gaugesData] of gauges.entries()) {
            (0, chai_1.expect)(await L2GaugeCheckpointer.getTotalGauges(GaugeType[gaugeType])).to.be.eq(gaugesData.length);
        }
    });
    describe('getTotalBridgeCost', () => {
        function itChecksTotalBridgeCost(minRelativeWeight) {
            it('checks total bridge cost', async () => {
                const arbitrumGauge = await task.instanceAt('ArbitrumRootGauge', gauges.get(GaugeType.Arbitrum)[0].address);
                const gaugesAmountAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Arbitrum, minRelativeWeight).length;
                const singleGaugeBridgeCost = await arbitrumGauge.getTotalBridgeCost();
                // Bridge cost per gauge is always the same, so total cost is (single gauge cost) * (number of gauges).
                (0, chai_1.expect)(await L2GaugeCheckpointer.getTotalBridgeCost(minRelativeWeight)).to.be.eq(singleGaugeBridgeCost.mul(gaugesAmountAboveMinWeight));
            });
        }
        context('when threshold is 1', () => {
            itChecksTotalBridgeCost((0, numbers_1.fp)(1));
        });
        context('when threshold is 0.0001', () => {
            itChecksTotalBridgeCost((0, numbers_1.fp)(0.0001));
        });
        context('when threshold is 0', () => {
            itChecksTotalBridgeCost((0, numbers_1.fp)(0));
        });
    });
    describe('getSingleBridgeCost', () => {
        it('gets the cost for an arbitrum gauge', async () => {
            const arbitrumGauge = await task.instanceAt('ArbitrumRootGauge', gauges.get(GaugeType.Arbitrum)[0].address);
            const bridgeCost = await arbitrumGauge.getTotalBridgeCost();
            const arbitrumType = GaugeType[GaugeType.Arbitrum];
            (0, chai_1.expect)(await L2GaugeCheckpointer.getSingleBridgeCost(arbitrumType, arbitrumGauge.address)).to.be.eq(bridgeCost);
        });
        it('gets the cost for an non-arbitrum gauge', async () => {
            const gnosisGauge = await task.instanceAt('GnosisRootGauge', gauges.get(GaugeType.Gnosis)[0].address);
            const gnosisType = GaugeType[GaugeType.Gnosis];
            (0, chai_1.expect)(await L2GaugeCheckpointer.getSingleBridgeCost(gnosisType, gnosisGauge.address)).to.be.eq(0);
        });
        it('reverts when the gauge address is not present in the type', async () => {
            const gnosisGauge = await task.instanceAt('GnosisRootGauge', gauges.get(GaugeType.Gnosis)[0].address);
            const polygonType = GaugeType[GaugeType.Polygon];
            await (0, chai_1.expect)(L2GaugeCheckpointer.getSingleBridgeCost(polygonType, gnosisGauge.address)).to.be.revertedWith('Gauge was not added to the checkpointer');
        });
    });
    describe('checkpoint', () => {
        sharedBeforeEach(async () => {
            // Gauges that are above a threshold will get another checkpoint attempt when the threshold is lowered.
            // This block takes a snapshot so that gauges can be repeatedly checkpointed without skipping.
        });
        context('when threshold is 1', () => {
            itCheckpointsGaugesAboveRelativeWeight((0, numbers_1.fp)(1), 0);
        });
        context('when threshold is 0.0001', () => {
            itCheckpointsGaugesAboveRelativeWeight((0, numbers_1.fp)(0.0001), 11);
        });
        context('when threshold is 0', () => {
            itCheckpointsGaugesAboveRelativeWeight((0, numbers_1.fp)(0), 20);
        });
        function itCheckpointsGaugesAboveRelativeWeight(minRelativeWeight, gaugesAboveThreshold) {
            let performCheckpoint;
            let gaugeDataAboveMinWeight = [];
            let ethereumGaugeDataAboveMinWeight, polygonGaugeDataAboveMinWeight, arbitrumGaugeDataAboveMinWeight, optimismGaugeDataAboveMinWeight, gnosisGaugeDataAboveMinWeight;
            sharedBeforeEach(async () => {
                ethereumGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Ethereum, minRelativeWeight);
                polygonGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Polygon, minRelativeWeight);
                arbitrumGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Arbitrum, minRelativeWeight);
                optimismGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Optimism, minRelativeWeight);
                gnosisGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Gnosis, minRelativeWeight);
            });
            context('when checkpointing all types', () => {
                sharedBeforeEach(async () => {
                    performCheckpoint = async () => {
                        const tx = await L2GaugeCheckpointer.checkpointGaugesAboveRelativeWeight(minRelativeWeight, {
                            value: await L2GaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
                        });
                        return await tx.wait();
                    };
                    gaugeDataAboveMinWeight = [
                        ...ethereumGaugeDataAboveMinWeight,
                        ...polygonGaugeDataAboveMinWeight,
                        ...arbitrumGaugeDataAboveMinWeight,
                        ...optimismGaugeDataAboveMinWeight,
                        ...gnosisGaugeDataAboveMinWeight,
                    ];
                    (0, chai_1.expect)(gaugeDataAboveMinWeight.length).to.be.eq(gaugesAboveThreshold);
                });
                itPerformsCheckpoint();
            });
            context('when checkpointing only Ethereum gauges', () => {
                sharedBeforeEach(async () => {
                    performCheckpoint = async () => {
                        const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(GaugeType[GaugeType.Ethereum], minRelativeWeight);
                        return await tx.wait();
                    };
                    gaugeDataAboveMinWeight = ethereumGaugeDataAboveMinWeight;
                });
                itPerformsCheckpoint();
            });
            context('when checkpointing only Polygon gauges', () => {
                sharedBeforeEach(async () => {
                    performCheckpoint = async () => {
                        const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(GaugeType[GaugeType.Polygon], minRelativeWeight);
                        return await tx.wait();
                    };
                    gaugeDataAboveMinWeight = polygonGaugeDataAboveMinWeight;
                });
                itPerformsCheckpoint();
            });
            context('when checkpointing only Arbitrum gauges', () => {
                sharedBeforeEach(async () => {
                    performCheckpoint = async () => {
                        const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(GaugeType[GaugeType.Arbitrum], minRelativeWeight, {
                            value: await L2GaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
                        });
                        return await tx.wait();
                    };
                    gaugeDataAboveMinWeight = arbitrumGaugeDataAboveMinWeight;
                });
                itPerformsCheckpoint();
            });
            context('when checkpointing only Optimism gauges', () => {
                sharedBeforeEach(async () => {
                    performCheckpoint = async () => {
                        const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(GaugeType[GaugeType.Optimism], minRelativeWeight);
                        return await tx.wait();
                    };
                    gaugeDataAboveMinWeight = optimismGaugeDataAboveMinWeight;
                });
                itPerformsCheckpoint();
            });
            context('when checkpointing only Gnosis gauges', () => {
                sharedBeforeEach(async () => {
                    performCheckpoint = async () => {
                        const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(GaugeType[GaugeType.Gnosis], minRelativeWeight);
                        return await tx.wait();
                    };
                    gaugeDataAboveMinWeight = gnosisGaugeDataAboveMinWeight;
                });
                itPerformsCheckpoint();
            });
            function itPerformsCheckpoint() {
                it('performs a checkpoint for (non-checkpointed) gauges', async () => {
                    const receipt = await performCheckpoint();
                    // Check that the right amount of checkpoints were actually performed for every gauge that required them.
                    gaugeDataAboveMinWeight.forEach((gaugeData) => {
                        expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'Checkpoint', {}, gaugeData.address, gaugeData.expectedCheckpoints);
                    });
                });
            }
        }
        describe('single gauge checkpoint', () => {
            context('when checkpointing a single Arbitrum gauge', () => {
                it('performs a checkpoint for (non-checkpointed) gauges', async () => {
                    const arbitrumGaugeData = gauges.get(GaugeType.Arbitrum)[0];
                    const arbitrumType = GaugeType[GaugeType.Arbitrum];
                    const tx = await L2GaugeCheckpointer.checkpointSingleGauge(arbitrumType, arbitrumGaugeData.address, {
                        value: await L2GaugeCheckpointer.getSingleBridgeCost(arbitrumType, arbitrumGaugeData.address),
                    });
                    expectEvent.inIndirectReceipt(await tx.wait(), checkpointInterface, 'Checkpoint', {}, arbitrumGaugeData.address, arbitrumGaugeData.expectedCheckpoints);
                });
            });
            context('when checkpointing a single non-Arbitrum gauge', () => {
                it('performs a checkpoint for (non-checkpointed) gauges', async () => {
                    const gnosisGaugeData = gauges.get(GaugeType.Gnosis)[0];
                    const gnosisType = GaugeType[GaugeType.Gnosis];
                    const tx = await L2GaugeCheckpointer.checkpointSingleGauge(gnosisType, gnosisGaugeData.address);
                    expectEvent.inIndirectReceipt(await tx.wait(), checkpointInterface, 'Checkpoint', {}, gnosisGaugeData.address, gnosisGaugeData.expectedCheckpoints);
                });
            });
        });
    });
    function getGaugeDataAboveMinWeight(gaugeType, fpMinRelativeWeight) {
        return gauges.get(gaugeType).filter((addressWeight) => addressWeight.weight.gte(fpMinRelativeWeight));
    }
});
