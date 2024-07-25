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
const hardhat_2 = require("hardhat");
const chai_1 = require("chai");
const _src_1 = require("@src");
const actions_1 = require("@helpers/models/misc/actions");
const numbers_1 = require("@helpers/numbers");
const constants_1 = require("@helpers/constants");
const expectEvent = __importStar(require("@helpers/expectEvent"));
(0, _src_1.describeForkTest)('AuthorizerWithAdaptorValidation', 'mainnet', 17047707, function () {
    let admin;
    let govMultisig, lmMultisig, swapFeeSetter;
    let authorizer, vault, actualAuthorizer, authorizerAdaptor, adaptorEntrypoint, gaugeAdder;
    let task;
    let addEthereumGaugeAction;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const LM_MULTISIG = '0xc38c5f97b34e175ffd35407fc91a937300e33860';
    const SWAP_FEE_SETTER = '0xE4a8ed6c1D8d048bD29A00946BFcf2DB10E7923B';
    before('run task', async () => {
        task = new _src_1.Task('20230414-authorizer-wrapper', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        authorizer = await task.deployedInstance('AuthorizerWithAdaptorValidation');
    });
    before('load signers', async () => {
        [, admin] = await hardhat_2.ethers.getSigners();
        govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(1000));
        lmMultisig = await (0, _src_1.impersonate)(LM_MULTISIG, (0, numbers_1.fp)(100));
        swapFeeSetter = await (0, _src_1.impersonate)(SWAP_FEE_SETTER, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        actualAuthorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        authorizerAdaptor = await new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('AuthorizerAdaptor');
        adaptorEntrypoint = await new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('AuthorizerAdaptorEntrypoint');
        gaugeAdder = await new _src_1.Task('20230109-gauge-adder-v3', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('GaugeAdder');
    });
    before('get actions', async () => {
        addEthereumGaugeAction = await (0, actions_1.actionId)(gaugeAdder, 'addEthereumGauge');
    });
    describe('getters', () => {
        it('stores the actual (existing basic) authorizer', async () => {
            (0, chai_1.expect)(await authorizer.getActualAuthorizer()).to.eq(actualAuthorizer.address);
        });
        it('stores the authorizer adaptor', async () => {
            (0, chai_1.expect)(await authorizer.getAuthorizerAdaptor()).to.eq(authorizerAdaptor.address);
        });
        it('stores the authorizer adaptor entrypoint', async () => {
            (0, chai_1.expect)(await authorizer.getAuthorizerAdaptorEntrypoint()).to.equal(adaptorEntrypoint.address);
        });
        it('configures the gauge adder', async () => {
            const entrypoint = await gaugeAdder.getAuthorizerAdaptorEntrypoint();
            const gaugeAdderAuthorizer = await adaptorEntrypoint.getAuthorizer();
            // Ensure the authorizer we just set the permissions on is the same one the gauge adder is using
            (0, chai_1.expect)(entrypoint).to.equal(adaptorEntrypoint.address);
            (0, chai_1.expect)(gaugeAdderAuthorizer).to.equal(actualAuthorizer.address);
        });
    });
    describe('Gauge Adder v3', () => {
        let gauge;
        sharedBeforeEach(async () => {
            const factoryTask = new _src_1.Task('20220822-mainnet-gauge-factory-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            const gaugeFactory = await factoryTask.deployedInstance('LiquidityGaugeFactory');
            const pool = '0x32296969ef14eb0c6d29669c550d4a0449130230';
            const tx = await gaugeFactory.create(pool, 0);
            const event = expectEvent.inIndirectReceipt(await tx.wait(), gaugeFactory.interface, 'GaugeCreated');
            gauge = event.args.gauge;
        });
        context('before the upgrade', () => {
            it('the LM multisig has permission to add gauges', async () => {
                (0, chai_1.expect)(await actualAuthorizer.canPerform(addEthereumGaugeAction, lmMultisig.address, constants_1.ZERO_ADDRESS)).to.be.true;
            });
            it('attempting to add gauges reverts as the Adaptor Entrypoint is not yet operational', async () => {
                await (0, chai_1.expect)(gaugeAdder.connect(lmMultisig).addEthereumGauge(gauge)).to.be.revertedWith('BAL#401');
            });
        });
        context('after the upgrade', () => {
            sharedBeforeEach('upgrade Authorizer', async () => {
                const setAuthorizerAction = await (0, actions_1.actionId)(vault, 'setAuthorizer');
                await actualAuthorizer.connect(govMultisig).grantRole(setAuthorizerAction, admin.address);
                await vault.connect(admin).setAuthorizer(authorizer.address);
                (0, chai_1.expect)(await vault.getAuthorizer()).to.equal(authorizer.address);
            });
            it('GaugeAdder can now add gauges', async () => {
                const tx = await gaugeAdder.connect(lmMultisig).addEthereumGauge(gauge);
                const gaugeControllerInterface = new hardhat_2.ethers.utils.Interface([
                    'event NewGauge(address gauge, int128 gaugeType, uint256 weight)',
                ]);
                expectEvent.inIndirectReceipt(await tx.wait(), gaugeControllerInterface, 'NewGauge', {
                    gauge,
                });
            });
        });
    });
    describe('set swap fee percentage', () => {
        let pool;
        sharedBeforeEach(async () => {
            const factoryTask = new _src_1.Task('20230206-weighted-pool-v3', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            pool = await factoryTask.instanceAt('WeightedPool', '0xEab8B160903B4a29D7D92C92b4ff632F5c964987');
        });
        context('before the upgrade', () => {
            it('the swap fee percentage can be set', async () => {
                const tx = await pool.connect(swapFeeSetter).setSwapFeePercentage((0, numbers_1.fp)(0.1));
                expectEvent.inReceipt(await tx.wait(), 'SwapFeePercentageChanged');
            });
        });
        context('after the upgrade', () => {
            sharedBeforeEach('upgrade Authorizer', async () => {
                const setAuthorizerAction = await (0, actions_1.actionId)(vault, 'setAuthorizer');
                await actualAuthorizer.connect(govMultisig).grantRole(setAuthorizerAction, admin.address);
                await vault.connect(admin).setAuthorizer(authorizer.address);
                (0, chai_1.expect)(await vault.getAuthorizer()).to.equal(authorizer.address);
            });
            it('the swap fee percentage can be still set', async () => {
                const tx = await pool.connect(swapFeeSetter).setSwapFeePercentage((0, numbers_1.fp)(0.1));
                expectEvent.inReceipt(await tx.wait(), 'SwapFeePercentageChanged');
            });
        });
    });
});
