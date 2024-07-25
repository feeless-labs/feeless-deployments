"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
(0, _src_1.describeForkTest)('GaugeAdderMigrationCoordinator', 'mainnet', 15150000, function () {
    let govMultisig;
    let coordinator;
    let vault, authorizer, authorizerAdaptor, gaugeController;
    let oldGaugeAdder;
    let newGaugeAdder;
    let arbitrumRootGaugeFactory;
    let optimismRootGaugeFactory;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20220721-gauge-adder-migration-coordinator', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.deployedInstance('GaugeAdderMigrationCoordinator');
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_2.Task('20220325-authorizer-adaptor', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const gaugeAdderTask = new _src_2.Task('20220325-gauge-adder', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        oldGaugeAdder = await gaugeAdderTask.deployedInstance('GaugeAdder');
        const gaugeAdderV2Task = new _src_2.Task('20220628-gauge-adder-v2', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        newGaugeAdder = await gaugeAdderV2Task.deployedInstance('GaugeAdder');
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
        const arbitrumRootGaugeFactoryTask = new _src_2.Task('20220413-arbitrum-root-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        arbitrumRootGaugeFactory = await arbitrumRootGaugeFactoryTask.deployedInstance('ArbitrumRootGaugeFactory');
        const optimismRootGaugeFactoryTask = new _src_2.Task('20220628-optimism-root-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        optimismRootGaugeFactory = await optimismRootGaugeFactoryTask.deployedInstance('OptimismRootGaugeFactory');
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG);
        await authorizer.connect(govMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address);
    });
    it('performs first stage', async () => {
        await coordinator.performNextStage();
        (0, chai_1.expect)(await coordinator.getCurrentStage()).to.equal(1);
    });
    it('adds the Optimism gauge type to the GaugeController', async () => {
        const OPTIMISM_GAUGE_TYPE = 5;
        (0, chai_1.expect)(await gaugeController.gauge_type_names(OPTIMISM_GAUGE_TYPE)).to.equal('Optimism');
    });
    it('adds the Optimism root gauge factory to the gauge adder', async () => {
        const OPTIMISM_GAUGE_TYPE = 5;
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeTypeCount(OPTIMISM_GAUGE_TYPE)).to.equal(1);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType(OPTIMISM_GAUGE_TYPE, 0)).to.equal(task.input().OptimismRootGaugeFactory);
    });
    it('transfers the rights to add new gauges to the new GaugeAdder', async () => {
        const addGaugePermission = await authorizerAdaptor.getActionId(gaugeController.interface.getSighash('add_gauge(address,int128)'));
        (0, chai_1.expect)(await authorizer.canPerform(addGaugePermission, oldGaugeAdder.address, authorizerAdaptor.address)).to.be
            .false;
        (0, chai_1.expect)(await authorizer.canPerform(addGaugePermission, newGaugeAdder.address, authorizerAdaptor.address)).to.be
            .true;
    });
    it('grants permissions to the multisig to add gauges of existing types on the new GaugeAdder', async () => {
        const multisig = task.input().LiquidityMiningMultisig;
        const activeAddGaugeFunctions = [
            'addEthereumGauge(address)',
            'addPolygonGauge(address)',
            'addArbitrumGauge(address)',
            'addOptimismGauge(address)',
        ];
        for (const addGaugeFunction of activeAddGaugeFunctions) {
            const permission = await (0, actions_1.actionId)(newGaugeAdder, addGaugeFunction);
            (0, chai_1.expect)(await authorizer.canPerform(permission, multisig, newGaugeAdder.address)).to.be.true;
        }
    });
    it("doesn't grant permissions to add gauges for the gauge types which haven't been created yet.", async () => {
        const multisig = task.input().LiquidityMiningMultisig;
        const inactiveAddGaugeFunctions = ['addGnosisGauge(address)', 'addZKSyncGauge(address)'];
        for (const addGaugeFunction of inactiveAddGaugeFunctions) {
            const permission = await (0, actions_1.actionId)(newGaugeAdder, addGaugeFunction);
            (0, chai_1.expect)(await authorizer.canPerform(permission, multisig, newGaugeAdder.address)).to.be.false;
        }
    });
    it('grants permissions for checkpointing multisig to set the bridge parameters', async () => {
        const multisig = task.input().GaugeCheckpointingMultisig;
        const setArbitrumFeesAction = await (0, actions_1.actionId)(arbitrumRootGaugeFactory, 'setArbitrumFees(uint64 gasLimit,uint64 gasPrice,uint64 maxSubmissionCost)');
        (0, chai_1.expect)(await authorizer.canPerform(setArbitrumFeesAction, multisig, arbitrumRootGaugeFactory.address)).to.be.true;
        const setOptimismGasLimitAction = await (0, actions_1.actionId)(optimismRootGaugeFactory, 'setOptimismGasLimit(uint32 gasLimit)');
        (0, chai_1.expect)(await authorizer.canPerform(setOptimismGasLimitAction, multisig, optimismRootGaugeFactory.address)).to.be
            .true;
    });
    it('renounces the admin role', async () => {
        (0, chai_1.expect)(await authorizer.hasRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address)).to.equal(false);
    });
});
