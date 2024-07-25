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
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const numbers_1 = require("@helpers/numbers");
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const relativeError_1 = require("@helpers/relativeError");
const expectTransfer_1 = require("@helpers/expectTransfer");
const constants_1 = require("@helpers/constants");
const lodash_1 = require("lodash");
const _src_1 = require("@src");
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
(0, _src_1.describeForkTest)('SingleRecipientGaugeFactory V2', 'mainnet', 16686000, function () {
    let admin, other, balWhale;
    let vault, authorizer, authorizerAdaptor, bal80weth20Pool, BALTokenAdmin, gaugeController, balToken, veBAL, factory, gauge;
    let BAL;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const BAL_WHALE = '0x740a4AEEfb44484853AA96aB12545FC0290805F3';
    const BAL80WETH20_POOL = '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56';
    const weightCap = (0, numbers_1.fp)(0.001);
    before('run task', async () => {
        task = new _src_1.Task('20230215-single-recipient-gauge-factory-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('SingleRecipientGaugeFactory');
    });
    before('advance time', async () => {
        // This causes all voting cooldowns to expire, letting the veBAL holder vote again
        await (0, time_1.advanceTime)(time_1.DAY * 12);
    });
    before('setup accounts', async () => {
        [, admin, other] = await (0, _src_1.getSigners)();
        balWhale = await (0, _src_1.impersonate)(BAL_WHALE, (0, numbers_1.fp)(10000));
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const weightedPoolTask = new _src_1.Task('20210418-weighted-pool', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        bal80weth20Pool = await weightedPoolTask.instanceAt('WeightedPool2Tokens', BAL80WETH20_POOL);
        const balancerTokenAdminTask = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        BALTokenAdmin = await balancerTokenAdminTask.deployedInstance('BalancerTokenAdmin');
        BAL = await BALTokenAdmin.getBalancerToken();
        const gaugeControllerTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
        veBAL = await gaugeControllerTask.deployedInstance('VotingEscrow');
        // We use test balancer token to make use of the ERC-20 interface.
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        balToken = await testBALTokenTask.instanceAt('TestBalancerToken', BAL);
    });
    before('get veBAL from BAL', async () => {
        const ethToJoin = (0, numbers_1.fp)(100);
        await balToken.connect(balWhale).approve(vault.address, constants_1.MAX_UINT256);
        const poolId = await bal80weth20Pool.getPoolId();
        await vault.connect(balWhale).joinPool(poolId, balWhale.address, balWhale.address, {
            assets: [BAL, constants_1.ZERO_ADDRESS],
            maxAmountsIn: [constants_1.MAX_UINT256, constants_1.MAX_UINT256],
            fromInternalBalance: false,
            userData: encoder_1.WeightedPoolEncoder.joinExactTokensInForBPTOut([await balToken.balanceOf(balWhale.address), ethToJoin], 0),
        }, { value: ethToJoin });
        await bal80weth20Pool.connect(balWhale).approve(veBAL.address, constants_1.MAX_UINT256);
        const currentTime = await (0, time_1.currentTimestamp)();
        await veBAL
            .connect(balWhale)
            .create_lock(await bal80weth20Pool.balanceOf(balWhale.address), currentTime.add(time_1.MONTH * 12));
    });
    // This block number is close to an epoch change, so we first move to the next one and update the emission rates
    // in the BAL token admin. This is not strictly necessary, but completing the whole test within the same epoch
    // simplifies the math for the expected emissions down below.
    before('update balancer token admin rate', async () => {
        await (0, time_1.advanceTime)(time_1.WEEK * 5);
        await BALTokenAdmin.update_mining_parameters();
    });
    let RecipientMode;
    (function (RecipientMode) {
        RecipientMode[RecipientMode["BasicRecipient"] = 0] = "BasicRecipient";
        RecipientMode[RecipientMode["FeeDistributorRecipient"] = 1] = "FeeDistributorRecipient";
    })(RecipientMode || (RecipientMode = {}));
    describe('getters', () => {
        const expectedGaugeVersion = {
            name: 'SingleRecipientGauge',
            version: 2,
            deployment: '20230215-single-recipient-gauge-factory-v2',
        };
        it('check gauge version', async () => {
            const tx = await factory.create(constants_1.ZERO_ADDRESS, (0, numbers_1.fp)(0), false);
            const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
            const gauge = await task.instanceAt('SingleRecipientGauge', event.args.gauge);
            (0, chai_1.expect)(await gauge.version()).to.equal(JSON.stringify(expectedGaugeVersion));
        });
        it('check gauge version from factory', async () => {
            (0, chai_1.expect)(await factory.getProductVersion()).to.equal(JSON.stringify(expectedGaugeVersion));
        });
        it('check factory version', async () => {
            const expectedFactoryVersion = {
                name: 'SingleRecipientGaugeFactory',
                version: 2,
                deployment: '20230215-single-recipient-gauge-factory-v2',
            };
            (0, chai_1.expect)(await factory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
    });
    context('with a basic recipient', () => {
        itWorksLikeACappedSingleRecipientGauge(RecipientMode.BasicRecipient);
    });
    context('with a FeeDistributor recipient', () => {
        itWorksLikeACappedSingleRecipientGauge(RecipientMode.FeeDistributorRecipient);
    });
    function itWorksLikeACappedSingleRecipientGauge(mode) {
        // We're going to create gauges, vote for them, have time pass, etc. Because of that, we take a snapshot before we
        // do any of that, and restore it at the end.
        let snapshot;
        before(async () => {
            snapshot = await (0, hardhat_network_helpers_1.takeSnapshot)();
        });
        after(async () => {
            await snapshot.restore();
        });
        let recipient;
        before(() => {
            if (mode == RecipientMode.BasicRecipient) {
                recipient = other.address;
            }
            else {
                const feeDistributorTask = new _src_1.Task('20220714-fee-distributor-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
                recipient = feeDistributorTask.output({ network: 'mainnet' }).FeeDistributor;
            }
        });
        it('create gauge', async () => {
            // We use an EOA as the single recipient; in practice it will probably be a contract.
            const tx = await factory.create(recipient, weightCap, mode == RecipientMode.FeeDistributorRecipient);
            const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
            gauge = await task.instanceAt('SingleRecipientGauge', event.args.gauge);
            (0, chai_1.expect)(await gauge.getRecipient()).to.equal(recipient);
            (0, chai_1.expect)(await gauge.isRecipientFeeDistributor()).to.equal(mode == RecipientMode.FeeDistributorRecipient);
            (0, chai_1.expect)(await factory.isGaugeFromFactory(gauge.address)).to.be.true;
        });
        it('grant permissions', async () => {
            // We are not using the GaugeAdder at the moment, so gauges shall be added to the gauge controller directly.
            // Therefore, we just grant the admin the permission to add the gauge to the controller, and perform a checkpoint.
            const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
            const gaugeControllerTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            await authorizer
                .connect(govMultisig)
                .grantRole(gaugeControllerTask.actionId('GaugeController', 'add_gauge(address,int128)'), admin.address);
            await authorizer
                .connect(govMultisig)
                .grantRole(await authorizerAdaptor.getActionId(gauge.interface.getSighash('checkpoint')), admin.address);
        });
        it('add gauge to gauge controller directly via AuthorizerAdaptor', async () => {
            // Using 2 as Ethereum gauge type, but it could be any of the existing types since they all have the same
            // relative weight in the controller.
            const calldata = gaugeController.interface.encodeFunctionData('add_gauge(address,int128)', [gauge.address, 2]);
            await authorizerAdaptor.connect(admin).performAction(gaugeController.address, calldata);
            (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
        });
        it('vote for gauge so that weight is above cap', async () => {
            (0, chai_1.expect)(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
            (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(0);
            // Max voting power is 10k points
            await gaugeController.connect(balWhale).vote_for_gauge_weights(gauge.address, 10000);
            // We now need to go through an epoch for the votes to be locked in
            await (0, time_1.advanceTime)(time_1.DAY * 8);
            await gaugeController.checkpoint();
            // Gauge weight is equal to the cap, and controller weight for the gauge is greater than the cap.
            (0, chai_1.expect)(await gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, await (0, time_1.currentWeekTimestamp)())).to.be.gt(weightCap);
            (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(weightCap);
        });
        it('mint & transfer tokens', async () => {
            // The gauge has votes for this week, and it will mint the first batch of tokens. We store the current gauge
            // relative weight, as it will change as time goes by due to vote decay.
            const firstMintWeekTimestamp = await (0, time_1.currentWeekTimestamp)();
            const calldata = gauge.interface.encodeFunctionData('checkpoint');
            const zeroMintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
            expectEvent.inIndirectReceipt(await zeroMintTx.wait(), gauge.interface, 'Checkpoint', {
                periodTime: firstMintWeekTimestamp.sub(time_1.WEEK),
                periodEmissions: 0,
            });
            // No token transfers are performed if the emissions are zero, but we can't test for a lack of those
            await (0, time_1.advanceTime)(time_1.WEEK);
            // The gauge should now mint and send all minted tokens to the Arbitrum bridge
            const mintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
            const event = expectEvent.inIndirectReceipt(await mintTx.wait(), gauge.interface, 'Checkpoint', {
                periodTime: firstMintWeekTimestamp,
            });
            const actualEmissions = event.args.periodEmissions;
            // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge
            const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
            // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
            const expectedEmissions = weightCap.mul(weeklyRate).div(numbers_1.FP_ONE);
            (0, relativeError_1.expectEqualWithError)(actualEmissions, expectedEmissions, 0.001);
            // Tokens are minted for the gauge
            (0, expectTransfer_1.expectTransferEvent)(await mintTx.wait(), {
                from: constants_1.ZERO_ADDRESS,
                to: gauge.address,
                value: actualEmissions,
            }, BAL);
            // And then forwarded to the recipient
            (0, expectTransfer_1.expectTransferEvent)(await mintTx.wait(), {
                from: gauge.address,
                to: recipient,
                value: actualEmissions,
            }, BAL);
        });
        it('mint multiple weeks', async () => {
            const numberOfWeeks = 5;
            await (0, time_1.advanceTime)(time_1.WEEK * numberOfWeeks);
            await gaugeController.checkpoint_gauge(gauge.address);
            const weekTimestamp = await (0, time_1.currentWeekTimestamp)();
            // We can query the relative weight of the gauge for each of the weeks that have passed
            const relativeWeights = await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, weekTimestamp.sub(time_1.WEEK * weekIndex))));
            // We require that they're all above the cap for simplicity - this lets us use the cap as each week's weight (and
            // also tests cap behavior).
            for (const relativeWeight of relativeWeights) {
                (0, chai_1.expect)(relativeWeight).to.be.gt(weightCap);
            }
            // The amount of tokens minted should equal the sum of the weekly emissions rate times the relative weight of the
            // gauge (this assumes we're not crossing an emissions rate epoch so that the inflation remains constant).
            const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
            // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
            const expectedEmissions = weightCap.mul(numberOfWeeks).mul(weeklyRate).div(numbers_1.FP_ONE);
            const calldata = gauge.interface.encodeFunctionData('checkpoint');
            const tx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
            await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => expectEvent.inIndirectReceipt(await tx.wait(), gauge.interface, 'Checkpoint', {
                periodTime: weekTimestamp.sub(time_1.WEEK * weekIndex),
            })));
            // Tokens are minted for the gauge
            const gaugeTransferEvent = (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
                from: constants_1.ZERO_ADDRESS,
                to: gauge.address,
            }, BAL);
            (0, chai_1.expect)(gaugeTransferEvent.args.value).to.be.almostEqual(expectedEmissions);
            // And then forwarded to the recipient
            (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
                from: gauge.address,
                to: recipient,
                value: gaugeTransferEvent.args.value,
            }, BAL);
        });
    }
});
