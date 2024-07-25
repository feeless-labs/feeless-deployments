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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
const TimelockAuthorizer_1 = __importDefault(require("@helpers/models/authorizer/TimelockAuthorizer"));
const time_1 = require("@helpers/time");
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('GaugeAdderV3', 'mainnet', 16370000, function () {
    let factory;
    let adaptorEntrypoint;
    let authorizer;
    let oldAuthorizer;
    let gaugeAdder;
    let daoMultisig;
    let gaugeController;
    let migrator;
    let vault;
    let task;
    const LM_MULTISIG = '0xc38c5f97b34e175ffd35407fc91a937300e33860';
    const LP_TOKEN = '0xbc5F4f9332d8415AAf31180Ab4661c9141CC84E4';
    const DAO_MULTISIG = '0x10a19e7ee7d7f8a52822f6817de8ea18204f2e4f';
    const weightCap = (0, numbers_1.fp)(0.001);
    before('create timelock authorizer', async () => {
        const timelockTask = new _src_2.Task('20221202-timelock-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await timelockTask.deployedInstance('TimelockAuthorizer');
        migrator = await timelockTask.deployedInstance('TimelockAuthorizerMigrator');
        const adaptorEntrypointTask = new _src_2.Task('20221124-authorizer-adaptor-entrypoint', _src_2.TaskMode.READ_ONLY, 'mainnet');
        adaptorEntrypoint = await adaptorEntrypointTask.deployedInstance('AuthorizerAdaptorEntrypoint');
    });
    before('change authorizer admin to the DAO multisig', async () => {
        await migrator.startRootTransfer();
        daoMultisig = await (0, _src_4.impersonate)(DAO_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer.connect(daoMultisig).claimRoot();
        const authorizerTask = new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        oldAuthorizer = await authorizerTask.deployedInstance('Authorizer');
        (0, chai_1.expect)(await migrator.oldAuthorizer()).to.be.eq(oldAuthorizer.address);
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        const setAuthorizerActionId = await (0, actions_1.actionId)(vault, 'setAuthorizer');
        await oldAuthorizer.connect(daoMultisig).grantRolesToMany([setAuthorizerActionId], [migrator.address]);
        await migrator.finalizeMigration();
    });
    before('run Gauge Adder task', async () => {
        task = new _src_2.Task('20230109-gauge-adder-v3', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        gaugeAdder = await task.deployedInstance('GaugeAdder');
    });
    context('construction', () => {
        it('stores the entrypoint', async () => {
            (0, chai_1.expect)(await gaugeAdder.getAuthorizerAdaptorEntrypoint()).to.equal(adaptorEntrypoint.address);
        });
        it('stores the gauge controller', async () => {
            const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
            gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
            // Ensure we can call functions on the gaugeController
            const controllerAdmin = await gaugeController.admin();
            (0, chai_1.expect)(controllerAdmin).to.not.equal(constants_1.ZERO_ADDRESS);
            (0, chai_1.expect)(await gaugeController.gauge_exists(constants_1.ZERO_ADDRESS)).to.be.false;
            (0, chai_1.expect)(await gaugeAdder.getGaugeController()).to.equal(gaugeController.address);
        });
    });
    context('advanced functions', () => {
        let lmMultisig;
        let admin;
        let gauge;
        before('load accounts', async () => {
            admin = await (0, _src_4.getSigner)(0);
            lmMultisig = await (0, _src_4.impersonate)(LM_MULTISIG, (0, numbers_1.fp)(100));
        });
        before('create gauge factory', async () => {
            const factoryTask = new _src_2.Task('20220822-mainnet-gauge-factory-v2', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
            await factoryTask.run({ force: true });
            factory = await factoryTask.deployedInstance('LiquidityGaugeFactory');
            (0, chai_1.expect)(await factory.isGaugeFromFactory(constants_1.ZERO_ADDRESS)).to.be.false;
        });
        // We need to grant permission to the admin to add the LiquidityGaugeFactory to the GaugeAdder, and also to add
        // gauges from said factory to the GaugeController.
        before('grant permissions', async () => {
            const addFactoryAction = await (0, actions_1.actionId)(gaugeAdder, 'addGaugeFactory');
            const addGaugeAction = await (0, actions_1.actionId)(gaugeAdder, 'addEthereumGauge');
            const gaugeControllerAddGaugeAction = await (0, actions_1.actionId)(adaptorEntrypoint, 'add_gauge(address,int128)', gaugeController.interface);
            await authorizer
                .connect(daoMultisig)
                .manageGranter(addFactoryAction, lmMultisig.address, TimelockAuthorizer_1.default.EVERYWHERE, true);
            await authorizer
                .connect(daoMultisig)
                .manageGranter(addGaugeAction, lmMultisig.address, TimelockAuthorizer_1.default.EVERYWHERE, true);
            await authorizer
                .connect(daoMultisig)
                .manageGranter(gaugeControllerAddGaugeAction, lmMultisig.address, TimelockAuthorizer_1.default.EVERYWHERE, true);
            let tx = await authorizer
                .connect(lmMultisig)
                .grantPermissions([addFactoryAction], admin.address, [TimelockAuthorizer_1.default.EVERYWHERE]);
            expectEvent.inReceipt(await tx.wait(), 'PermissionGranted', {
                actionId: addFactoryAction,
                account: admin.address,
                where: TimelockAuthorizer_1.default.EVERYWHERE,
            });
            tx = await authorizer
                .connect(lmMultisig)
                .grantPermissions([addGaugeAction], admin.address, [TimelockAuthorizer_1.default.EVERYWHERE]);
            expectEvent.inReceipt(await tx.wait(), 'PermissionGranted', {
                actionId: addGaugeAction,
                account: admin.address,
                where: TimelockAuthorizer_1.default.EVERYWHERE,
            });
            // Granting `GaugeController#add_gauge` permissions to the entrypoint has a delay, so the permission needs
            // to be scheduled and executed after the required time passes.
            tx = await authorizer
                .connect(lmMultisig)
                .scheduleGrantPermission(gaugeControllerAddGaugeAction, gaugeAdder.address, TimelockAuthorizer_1.default.EVERYWHERE, []);
            const event = expectEvent.inReceipt(await tx.wait(), 'ExecutionScheduled');
            const scheduledExecutionId = event.args.scheduledExecutionId;
            // The adder cannot add a gauge in the controller before the delay passes.
            (0, chai_1.expect)(await authorizer.canPerform(gaugeControllerAddGaugeAction, gaugeAdder.address, TimelockAuthorizer_1.default.EVERYWHERE)).to.be.false;
            await (0, time_1.advanceTime)(14 * time_1.DAY);
            await authorizer.connect(lmMultisig).execute(scheduledExecutionId);
            (0, chai_1.expect)(await authorizer.canPerform(addFactoryAction, admin.address, TimelockAuthorizer_1.default.EVERYWHERE)).to.be.true;
            (0, chai_1.expect)(await authorizer.canPerform(addGaugeAction, admin.address, TimelockAuthorizer_1.default.EVERYWHERE)).to.be.true;
            (0, chai_1.expect)(await authorizer.canPerform(gaugeControllerAddGaugeAction, gaugeAdder.address, TimelockAuthorizer_1.default.EVERYWHERE)).to.be.true;
            const entrypoint = await gaugeAdder.getAuthorizerAdaptorEntrypoint();
            const gaugeAdderAuthorizer = await adaptorEntrypoint.getAuthorizer();
            // Ensure the authorizer we just set the permissions on is the same one the gauge adder is using
            (0, chai_1.expect)(entrypoint).to.equal(adaptorEntrypoint.address);
            (0, chai_1.expect)(gaugeAdderAuthorizer).to.equal(authorizer.address);
        });
        it('can add factories for a gauge type', async () => {
            const tx = await gaugeAdder.connect(admin).addGaugeFactory(factory.address, 2); // Ethereum is type 2
            expectEvent.inReceipt(await tx.wait(), 'GaugeFactoryAdded', {
                gaugeType: 2,
                gaugeFactory: factory.address,
            });
        });
        it('can add gauge to controller', async () => {
            const tx = await factory.create(LP_TOKEN, weightCap);
            const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
            gauge = await task.instanceAt('LiquidityGaugeV5', event.args.gauge);
            await gaugeAdder.connect(admin).addEthereumGauge(gauge.address);
            (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
        });
    });
});
