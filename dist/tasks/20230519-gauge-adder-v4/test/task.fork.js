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
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('GaugeAdderV4', 'mainnet', 17295800, function () {
    let factory;
    let adaptorEntrypoint;
    let authorizer;
    let gaugeAdder;
    let daoMultisig;
    let gaugeController;
    let task, mainnetGaugeFactoryTask;
    const LP_TOKEN = '0xbc5F4f9332d8415AAf31180Ab4661c9141CC84E4';
    const DAO_MULTISIG = '0x10a19e7ee7d7f8a52822f6817de8ea18204f2e4f';
    const weightCap = (0, numbers_1.fp)(0.001);
    before('run Gauge Adder task', async () => {
        task = new _src_2.Task('20230519-gauge-adder-v4', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        gaugeAdder = await task.deployedInstance('GaugeAdder');
    });
    before('setup accounts', async () => {
        daoMultisig = await (0, _src_4.impersonate)(DAO_MULTISIG, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        const authorizerWrapperTask = new _src_2.Task('20221124-authorizer-adaptor-entrypoint', _src_2.TaskMode.READ_ONLY, 'mainnet');
        adaptorEntrypoint = await authorizerWrapperTask.deployedInstance('AuthorizerAdaptorEntrypoint');
        // At this block we have the authorizer wrapper in place, which is adaptor entrypoint aware.
        const authorizerTask = new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await authorizerTask.deployedInstance('Authorizer');
        // We'll need this task later on.
        mainnetGaugeFactoryTask = new _src_2.Task('20220822-mainnet-gauge-factory-v2', _src_2.TaskMode.READ_ONLY, 'mainnet');
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
        let admin;
        let gauge;
        before('load accounts', async () => {
            admin = await (0, _src_4.getSigner)(0);
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
            const addGaugeTypeAction = await (0, actions_1.actionId)(gaugeAdder, 'addGaugeType');
            const setFactoryAction = await (0, actions_1.actionId)(gaugeAdder, 'setGaugeFactory');
            const addGaugeAction = await (0, actions_1.actionId)(gaugeAdder, 'addGauge');
            const gaugeControllerAddGaugeAction = await (0, actions_1.actionId)(adaptorEntrypoint, 'add_gauge(address,int128)', gaugeController.interface);
            await authorizer.connect(daoMultisig).grantRole(addGaugeTypeAction, admin.address);
            await authorizer.connect(daoMultisig).grantRole(setFactoryAction, admin.address);
            await authorizer.connect(daoMultisig).grantRole(addGaugeAction, admin.address);
            await authorizer.connect(daoMultisig).grantRole(gaugeControllerAddGaugeAction, gaugeAdder.address);
        });
        it('can add a gauge type', async () => {
            const tx = await gaugeAdder.connect(admin).addGaugeType('Ethereum');
            const receipt = await tx.wait();
            // `expectEvent` does not work with indexed strings, so we decode the pieces we are interested in manually.
            // One event in receipt, named `GaugeTypeAdded`
            (0, chai_1.expect)(receipt.events.length).to.be.eq(1);
            const event = receipt.events[0];
            (0, chai_1.expect)(event.event).to.be.eq('GaugeTypeAdded');
            // Contains expected `gaugeType` and `gaugeFactory`.
            const decodedArgs = event.decode(event.data);
            (0, chai_1.expect)(decodedArgs.gaugeType).to.be.eq('Ethereum');
        });
        it('returns the added type correctly', async () => {
            (0, chai_1.expect)(await gaugeAdder.getGaugeTypesCount()).to.eq(1);
            (0, chai_1.expect)(await gaugeAdder.getGaugeTypes()).to.deep.eq(['Ethereum']);
            (0, chai_1.expect)(await gaugeAdder.getGaugeTypeAtIndex(0)).to.eq('Ethereum');
            (0, chai_1.expect)(await gaugeAdder.isValidGaugeType('Ethereum')).to.be.true;
            (0, chai_1.expect)(await gaugeAdder.isValidGaugeType('ZkSync')).to.be.false;
        });
        it('can add factories for a gauge type', async () => {
            const tx = await gaugeAdder.connect(admin).setGaugeFactory(factory.address, 'Ethereum'); // Ethereum is type 2
            const receipt = await tx.wait();
            // `expectEvent` does not work with indexed strings, so we decode the pieces we are interested in manually.
            // One event in receipt, named `GaugeFactorySet`
            (0, chai_1.expect)(receipt.events.length).to.be.eq(1);
            const event = receipt.events[0];
            (0, chai_1.expect)(event.event).to.be.eq('GaugeFactorySet');
            // Contains expected `gaugeType` and `gaugeFactory`.
            const decodedArgs = event.decode(event.data);
            (0, chai_1.expect)(decodedArgs.gaugeType).to.be.eq('Ethereum');
            (0, chai_1.expect)(decodedArgs.gaugeFactory).to.be.eq(factory.address);
        });
        it('returns added factory correctly', async () => {
            (0, chai_1.expect)(await gaugeAdder.getFactoryForGaugeType('Ethereum')).to.eq(factory.address);
        });
        it('can add gauge to adder and controller', async () => {
            const tx = await factory.create(LP_TOKEN, weightCap);
            const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
            gauge = await mainnetGaugeFactoryTask.instanceAt('LiquidityGaugeV5', event.args.gauge);
            await gaugeAdder.connect(admin).addGauge(gauge.address, 'Ethereum');
            (0, chai_1.expect)(await gaugeAdder.isGaugeFromValidFactory(gauge.address, 'Ethereum')).to.be.true;
            (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
        });
    });
});
