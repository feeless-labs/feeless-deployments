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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const time_1 = require("@helpers/time");
(0, _src_1.describeForkTest)('veBALL2GaugeSetupCoordinator', 'mainnet', 14616219, function () {
    let govMultisig, checkpointMultisig;
    let coordinator;
    let vault, authorizer, authorizerAdaptor, gaugeController, polygonRootGaugeFactory, arbitrumRootGaugeFactory, gaugeAdder;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20220415-veBAL-L2-gauge-setup-coordinator', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.deployedInstance('veBALL2GaugeSetupCoordinator');
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.instanceAt('Vault', vaultTask.output({ network: 'mainnet' }).Vault);
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_2.Task('20220325-authorizer-adaptor', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.instanceAt('AuthorizerAdaptor', authorizerAdaptorTask.output({ network: 'mainnet' }).AuthorizerAdaptor);
        const gaugeAdderTask = new _src_2.Task('20220325-gauge-adder', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        gaugeAdder = await gaugeAdderTask.instanceAt('GaugeAdder', gaugeAdderTask.output({ network: 'mainnet' }).GaugeAdder);
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.instanceAt('GaugeController', gaugeControllerTask.output({ network: 'mainnet' }).GaugeController);
        const polygonRootGaugeFactoryTask = new _src_2.Task('20220413-polygon-root-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        polygonRootGaugeFactory = await polygonRootGaugeFactoryTask.instanceAt('PolygonRootGaugeFactory', polygonRootGaugeFactoryTask.output({ network: 'mainnet' }).PolygonRootGaugeFactory);
        const arbitrumRootGaugeFactoryTask = new _src_2.Task('20220413-arbitrum-root-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        arbitrumRootGaugeFactory = await arbitrumRootGaugeFactoryTask.instanceAt('ArbitrumRootGaugeFactory', arbitrumRootGaugeFactoryTask.output({ network: 'mainnet' }).ArbitrumRootGaugeFactory);
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG);
        checkpointMultisig = await (0, _src_4.impersonate)(await coordinator.GAUGE_CHECKPOINTER_MULTISIG());
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await vaultTask.instanceAt('Authorizer', await coordinator.getAuthorizer());
        await authorizer
            .connect(govMultisig)
            .grantRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address);
    });
    it('perform first stage', async () => {
        await coordinator.performFirstStage();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(1);
    });
    it('perform second stage', async () => {
        await coordinator.performSecondStage();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(2);
    });
    it('kills temporary SingleRecipient Polygon and Arbitrum gauges', async () => {
        const singleRecipientGaugeFactoryTask = new _src_2.Task('20220325-single-recipient-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const gaugeFactory = await singleRecipientGaugeFactoryTask.instanceAt('SingleRecipientGaugeFactory', singleRecipientGaugeFactoryTask.output({ network: 'mainnet' }).SingleRecipientGaugeFactory);
        const gauges = await Promise.all(['0x9fb8312CEdFB9b35364FF06311B429a2f4Cdf422', '0x3F829a8303455CB36B7Bcf3D1bdc18D5F6946aeA'].map(async (gaugeAddress) => {
            (0, chai_1.expect)(await gaugeFactory.isGaugeFromFactory(gaugeAddress)).to.equal(true);
            const gauge = await singleRecipientGaugeFactoryTask.instanceAt('SingleRecipientGauge', gaugeAddress);
            (0, chai_1.expect)(await gauge.is_killed()).to.equal(true);
            return gauge;
        }));
        const BALHolderFactoryTask = new _src_2.Task('20220325-bal-token-holder-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        (0, chai_1.expect)(await (await BALHolderFactoryTask.instanceAt('BALTokenHolder', await gauges[0].getRecipient())).getName()).to.equal('Temporary Polygon Liquidity Mining BAL Holder');
        (0, chai_1.expect)(await (await BALHolderFactoryTask.instanceAt('BALTokenHolder', await gauges[1].getRecipient())).getName()).to.equal('Temporary Arbitrum Liquidity Mining BAL Holder');
    });
    it('adds the Polygon root gauge factory to the gauge adder', async () => {
        const polygonRootGaugeFactoryTask = new _src_2.Task('20220413-polygon-root-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const POLYGON_GAUGE_TYPE = 3;
        (0, chai_1.expect)(await gaugeController.gauge_type_names(POLYGON_GAUGE_TYPE)).to.equal('Polygon');
        (0, chai_1.expect)(await gaugeAdder.getFactoryForGaugeTypeCount(POLYGON_GAUGE_TYPE)).to.equal(1);
        (0, chai_1.expect)(await gaugeAdder.getFactoryForGaugeType(POLYGON_GAUGE_TYPE, 0)).to.equal(polygonRootGaugeFactoryTask.output({ network: 'mainnet' }).PolygonRootGaugeFactory);
    });
    it('adds the Arbitrum root gauge factory to the gauge adder', async () => {
        const arbitrumRootGaugeFactoryTask = new _src_2.Task('20220413-arbitrum-root-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const ARBITRUM_GAUGE_TYPE = 4;
        (0, chai_1.expect)(await gaugeController.gauge_type_names(ARBITRUM_GAUGE_TYPE)).to.equal('Arbitrum');
        (0, chai_1.expect)(await gaugeAdder.getFactoryForGaugeTypeCount(ARBITRUM_GAUGE_TYPE)).to.equal(1);
        (0, chai_1.expect)(await gaugeAdder.getFactoryForGaugeType(ARBITRUM_GAUGE_TYPE, 0)).to.equal(arbitrumRootGaugeFactoryTask.output({ network: 'mainnet' }).ArbitrumRootGaugeFactory);
    });
    it('sets the multisig as the checkpointer of root gauges', async () => {
        const totalGauges = await gaugeController.n_gauges();
        // Arbitrum gauges are added before Polygon gauges, so the last gauge should be a Polygon one, and one of the
        // prior gauges should be an Arbitrum one.
        const polygonGaugeAddress = await gaugeController.gauges(totalGauges.sub(1));
        const arbitrumGaugeAddress = await gaugeController.gauges(totalGauges.sub(20));
        (0, chai_1.expect)(await polygonRootGaugeFactory.isGaugeFromFactory(polygonGaugeAddress)).to.equal(true);
        (0, chai_1.expect)(await arbitrumRootGaugeFactory.isGaugeFromFactory(arbitrumGaugeAddress)).to.equal(true);
        // A new epoch needs to begin for gauges to be checkpointable
        await (0, time_1.advanceTime)(time_1.WEEK);
        const gaugeInterface = new hardhat_1.ethers.utils.Interface([
            'function checkpoint()',
            'event Checkpoint(uint256 indexed periodTime, uint256 periodEmissions)',
        ]);
        for (const gaugeAddress of [arbitrumGaugeAddress, polygonGaugeAddress]) {
            const tx = await authorizerAdaptor
                .connect(checkpointMultisig)
                .performAction(gaugeAddress, gaugeInterface.encodeFunctionData('checkpoint'));
            expectEvent.inIndirectReceipt(await tx.wait(), gaugeInterface, 'Checkpoint');
        }
    });
    it('renounces the admin role', async () => {
        (0, chai_1.expect)(await authorizer.hasRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address)).to.equal(false);
    });
});
