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
(0, _src_1.describeForkTest)('GaugeAdderMigrationCoordinator-V3-V4', 'mainnet', 17322200, function () {
    let govMultisig;
    let coordinator;
    let authorizer, authorizerAdaptor, gaugeController;
    let oldGaugeAdder;
    let newGaugeAdder;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20230519-gauge-adder-migration-v3-to-v4', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.deployedInstance('GaugeAdderMigrationCoordinator');
    });
    before('setup contracts', async () => {
        const authorizerTask = new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await authorizerTask.deployedInstance('Authorizer');
        const authorizerAdaptorTask = new _src_2.Task('20220325-authorizer-adaptor', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const oldGaugeAdderTask = new _src_2.Task('20230109-gauge-adder-v3', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        oldGaugeAdder = await oldGaugeAdderTask.deployedInstance('GaugeAdder');
        const newGaugeAdderTask = new _src_2.Task('20230519-gauge-adder-v4', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
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
    it('gauge adder has the expected types set up', async () => {
        const gaugeTypes = await newGaugeAdder.getGaugeTypes();
        (0, chai_1.expect)(gaugeTypes).to.be.deep.eq([
            'Ethereum',
            'Polygon',
            'Arbitrum',
            'Optimism',
            'Gnosis',
            'PolygonZkEvm',
            'ZkSync',
        ]);
    });
    it('gauge adder has the expected factories set up', async () => {
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType('Ethereum')).to.equal(task.input().LiquidityGaugeFactory);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType('Polygon')).to.equal(task.input().PolygonRootGaugeFactory);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType('Arbitrum')).to.equal(task.input().ArbitrumRootGaugeFactory);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType('Optimism')).to.equal(task.input().OptimismRootGaugeFactory);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType('Gnosis')).to.equal(task.input().GnosisRootGaugeFactory);
        (0, chai_1.expect)(await newGaugeAdder.getFactoryForGaugeType('PolygonZkEvm')).to.equal(task.input().PolygonZkEVMRootGaugeFactory);
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
        const permission = await (0, actions_1.actionId)(newGaugeAdder, 'addGauge');
        (0, chai_1.expect)(await authorizer.canPerform(permission, multisig, newGaugeAdder.address)).to.be.true;
    });
    it('does not hold permission to add gauge types', async () => {
        const permission = await (0, actions_1.actionId)(newGaugeAdder, 'addGaugeType');
        (0, chai_1.expect)(await authorizer.hasRole(permission, coordinator.address)).to.equal(false);
    });
    it('does not hold permission to set gauge factories', async () => {
        const permission = await (0, actions_1.actionId)(newGaugeAdder, 'setGaugeFactory');
        (0, chai_1.expect)(await authorizer.hasRole(permission, coordinator.address)).to.equal(false);
    });
    it('does not hold permission to add gauges', async () => {
        const permission = await (0, actions_1.actionId)(newGaugeAdder, 'addGauge');
        (0, chai_1.expect)(await authorizer.hasRole(permission, coordinator.address)).to.equal(false);
    });
    it('renounces the admin role', async () => {
        (0, chai_1.expect)(await authorizer.hasRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address)).to.equal(false);
    });
});
