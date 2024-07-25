"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
(0, _src_1.describeForkTest)('GaugeAdderMigrationCoordinator', 'mainnet', 16378450, function () {
    let govMultisig;
    let coordinator;
    let vault, authorizer, authorizerAdaptor, gaugeController;
    let oldGaugeAdder;
    let newGaugeAdder;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20230109-gauge-adder-migration-v2-to-v3', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.deployedInstance('GaugeAdderMigrationCoordinator');
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_2.Task('20220325-authorizer-adaptor', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const oldGaugeAdderTask = new _src_2.Task('20220628-gauge-adder-v2', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        oldGaugeAdder = await oldGaugeAdderTask.deployedInstance('GaugeAdder');
        const newGaugeAdderTask = new _src_2.Task('20230109-gauge-adder-v3', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        newGaugeAdder = await newGaugeAdderTask.deployedInstance('GaugeAdder');
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer.connect(govMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address);
    });
    it('performs first stage', async () => {
        await coordinator.performNextStage();
        (0, chai_1.expect)(await coordinator.getCurrentStage()).to.equal(1);
    });
    it('gauge adder has the expected factories set up', async () => {
        const ETHEREUM_GAUGE_TYPE = 2;
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeTypeCount(ETHEREUM_GAUGE_TYPE)).to.equal(1);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType(ETHEREUM_GAUGE_TYPE, 0)).to.equal(task.input().LiquidityGaugeFactory);
        const POLYGON_GAUGE_TYPE = 3;
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeTypeCount(POLYGON_GAUGE_TYPE)).to.equal(1);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType(POLYGON_GAUGE_TYPE, 0)).to.equal(task.input().PolygonRootGaugeFactory);
        const ARBITRUM_GAUGE_TYPE = 4;
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeTypeCount(ARBITRUM_GAUGE_TYPE)).to.equal(1);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType(ARBITRUM_GAUGE_TYPE, 0)).to.equal(task.input().ArbitrumRootGaugeFactory);
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
    it('renounces the admin role', async () => {
        (0, chai_1.expect)(await authorizer.hasRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address)).to.equal(false);
    });
});
