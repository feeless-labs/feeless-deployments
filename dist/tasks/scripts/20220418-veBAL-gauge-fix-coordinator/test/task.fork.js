"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const expectTransfer_1 = require("@helpers/expectTransfer");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const constants_1 = require("@helpers/constants");
const lodash_1 = require("lodash");
(0, _src_1.describeForkTest)('veBALGaugeFixCoordinator', 'mainnet', 14850000, function () {
    let govMultisig;
    let coordinator;
    let authorizer, gaugeController;
    let task;
    const BAL_TOKEN = '0xba100000625a3754423978a60c9317c58a424e3D';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const VEBAL_BAL_TOKEN_HOLDER = '0x3C1d00181ff86fbac0c3C52991fBFD11f6491D70';
    const ARBITRUM_BAL_TOKEN_HOLDER = '0x0C925fcE89a22E36EbD9B3C6E0262234E853d2F6';
    const POLYGON_BAL_TOKEN_HOLDER = '0x98087bf6A5CA828a6E09391aCE674DBaBB6a4C56';
    const LMC_GAUGE_TYPE = 0;
    let executeReceipt;
    before('run task', async () => {
        task = new _src_2.Task('20220418-veBAL-gauge-fix-coordinator', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.instanceAt('veBALGaugeFixCoordinator', task.output({ network: 'test' }).veBALGaugeFixCoordinator);
    });
    before('setup contracts', async () => {
        const gaugeControllerTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.instanceAt('GaugeController', gaugeControllerTask.output({ network: 'mainnet' }).GaugeController);
    });
    before('grant permissions', async () => {
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG);
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await vaultTask.instanceAt('Authorizer', await coordinator.getAuthorizer());
        await authorizer
            .connect(govMultisig)
            .grantRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address);
    });
    it('perform first stage', async () => {
        executeReceipt = await (await coordinator.performFirstStage()).wait();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(1);
    });
    it('sets zero weight for the LMC gauge type', async () => {
        (0, chai_1.expect)(await gaugeController.gauge_type_names(LMC_GAUGE_TYPE)).to.equal('Liquidity Mining Committee');
        (0, chai_1.expect)(await gaugeController.get_type_weight(LMC_GAUGE_TYPE)).to.equal(0);
    });
    it('sets equal weights for all other gauge types', async () => {
        for (const type of (0, lodash_1.range)(0, await gaugeController.n_gauge_types())) {
            if (type == LMC_GAUGE_TYPE)
                continue;
            (0, chai_1.expect)(await gaugeController.get_type_weight(type)).to.equal(1);
        }
    });
    it('kills LCM SingleRecipient gauge', async () => {
        const singleRecipientGaugeFactoryTask = new _src_2.Task('20220325-single-recipient-gauge-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        const gaugeFactory = await singleRecipientGaugeFactoryTask.instanceAt('SingleRecipientGaugeFactory', singleRecipientGaugeFactoryTask.output({ network: 'mainnet' }).SingleRecipientGaugeFactory);
        const gaugeAddress = '0x7AA5475b2eA29a9F4a1B9Cf1cB72512D1B4Ab75e';
        (0, chai_1.expect)(await gaugeFactory.isGaugeFromFactory(gaugeAddress)).to.equal(true);
        const gauge = await singleRecipientGaugeFactoryTask.instanceAt('SingleRecipientGauge', gaugeAddress);
        const BALHolderFactoryTask = new _src_2.Task('20220325-bal-token-holder-factory', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        (0, chai_1.expect)(await (await BALHolderFactoryTask.instanceAt('BALTokenHolder', await gauge.getRecipient())).getName()).to.equal('Liquidity Mining Committee BAL Holder');
        (0, chai_1.expect)(await gauge.is_killed()).to.equal(true);
    });
    it('mints BAL for veBAL holders', async () => {
        (0, expectTransfer_1.expectTransferEvent)(executeReceipt, {
            from: constants_1.ZERO_ADDRESS,
            to: VEBAL_BAL_TOKEN_HOLDER,
            value: (0, numbers_1.bn)('14500e18').mul(2),
        }, BAL_TOKEN);
    });
    it('mints BAL for Arbitrum LPs', async () => {
        (0, expectTransfer_1.expectTransferEvent)(executeReceipt, {
            from: constants_1.ZERO_ADDRESS,
            to: ARBITRUM_BAL_TOKEN_HOLDER,
            value: (0, numbers_1.bn)('10150e18').mul(2),
        }, BAL_TOKEN);
    });
    it('mints BAL for Polygon LPs', async () => {
        (0, expectTransfer_1.expectTransferEvent)(executeReceipt, {
            from: constants_1.ZERO_ADDRESS,
            to: POLYGON_BAL_TOKEN_HOLDER,
            value: (0, numbers_1.bn)('24650e18').mul(2),
        }, BAL_TOKEN);
    });
    it('renounces the admin role', async () => {
        (0, chai_1.expect)(await authorizer.hasRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address)).to.equal(false);
    });
});
