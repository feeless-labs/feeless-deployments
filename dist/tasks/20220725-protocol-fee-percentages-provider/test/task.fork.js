"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const actions_1 = require("@helpers/models/misc/actions");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('ProtocolFeePercentagesProvider', 'mainnet', 15130000, function () {
    let admin;
    let protocolFeePercentagesProvider;
    let vault, authorizer, feesCollector;
    let task;
    let FeeType;
    (function (FeeType) {
        FeeType[FeeType["Swap"] = 0] = "Swap";
        FeeType[FeeType["FlashLoan"] = 1] = "FlashLoan";
        FeeType[FeeType["Yield"] = 2] = "Yield";
        FeeType[FeeType["AUM"] = 3] = "AUM";
    })(FeeType || (FeeType = {}));
    before('run task', async () => {
        task = new _src_1.Task('20220725-protocol-fee-percentages-provider', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        protocolFeePercentagesProvider = await task.deployedInstance('ProtocolFeePercentagesProvider');
    });
    before('setup accounts', async () => {
        admin = await (0, _src_1.getSigner)(0);
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        feesCollector = await vaultTask.instanceAt('ProtocolFeesCollector', await vault.getProtocolFeesCollector());
    });
    before('setup admin', async () => {
        const DEFAULT_ADMIN_ROLE = await authorizer.DEFAULT_ADMIN_ROLE();
        admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(DEFAULT_ADMIN_ROLE, 0));
    });
    context('without permissions', () => {
        itRevertsSettingFee(FeeType.Yield, (0, numbers_1.fp)(0.0157));
        itRevertsSettingFee(FeeType.Swap, (0, numbers_1.fp)(0.0126));
    });
    context('with setFeeTypePercentage permission', () => {
        before('grant setFeePercentage permission to admin', async () => {
            await authorizer
                .connect(admin)
                .grantRole(await (0, actions_1.actionId)(protocolFeePercentagesProvider, 'setFeeTypePercentage'), admin.address);
        });
        itSetsFeeCorrectly(FeeType.Yield, (0, numbers_1.fp)(0.1537));
        itRevertsSettingFee(FeeType.Swap, (0, numbers_1.fp)(0.0857));
        context('with swapFeePercentage permission', () => {
            before('grant setSwapFeePercentage permission to fees provider', async () => {
                await authorizer
                    .connect(admin)
                    .grantRole(await (0, actions_1.actionId)(feesCollector, 'setSwapFeePercentage'), protocolFeePercentagesProvider.address);
            });
            itSetsFeeCorrectly(FeeType.Swap, (0, numbers_1.fp)(0.0951));
        });
    });
    function itSetsFeeCorrectly(feeType, fee) {
        it(`set ${FeeType[feeType]} fee`, async () => {
            await protocolFeePercentagesProvider.connect(admin).setFeeTypePercentage(feeType, fee);
            (0, chai_1.expect)(await protocolFeePercentagesProvider.getFeeTypePercentage(feeType)).to.be.eq(fee);
        });
    }
    function itRevertsSettingFee(feeType, fee) {
        it(`revert setting ${FeeType[feeType]} fee`, async () => {
            (0, chai_1.expect)(protocolFeePercentagesProvider.connect(admin).setFeeTypePercentage(feeType, fee)).to.be.revertedWith('BAL#401');
        });
    }
});
