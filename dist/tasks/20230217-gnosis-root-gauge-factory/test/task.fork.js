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
const abi_1 = require("@ethersproject/abi");
const chai_1 = require("chai");
const types_1 = require("@helpers/models/types/types");
const numbers_1 = require("@helpers/numbers");
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const relativeError_1 = require("@helpers/relativeError");
const constants_1 = require("@helpers/constants");
const lodash_1 = require("lodash");
const expectTransfer_1 = require("@helpers/expectTransfer");
const _src_4 = require("@src");
const encoder_1 = require("@helpers/models/pools/weighted/encoder");
(0, _src_4.describeForkTest)('GnosisRootGaugeFactory', 'mainnet', 16627100, function () {
    let veBALHolder, admin, recipient;
    let factory, gauge;
    let vault, authorizer, authorizerAdaptor, BALTokenAdmin, gaugeController, veBAL, bal80weth20Pool;
    let BAL;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const VEBAL_POOL = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56';
    const VAULT_BOUNTY = (0, numbers_1.fp)(1000);
    const weightCap = (0, numbers_1.fp)(0.001);
    before('run task', async () => {
        task = new _src_1.Task('20230217-gnosis-root-gauge-factory', _src_1.TaskMode.TEST, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        factory = await task.deployedInstance('GnosisRootGaugeFactory');
    });
    before('advance time', async () => {
        // This causes all voting cooldowns to expire, letting the veBAL holder vote again
        await (0, time_1.advanceTime)(time_1.DAY * 12);
    });
    before('setup accounts', async () => {
        admin = await (0, _src_3.getSigner)(0);
        recipient = await (0, _src_3.getSigner)(1);
        veBALHolder = await (0, _src_3.impersonate)((await (0, _src_3.getSigner)(2)).address, VAULT_BOUNTY.add((0, numbers_1.fp)(5))); // plus gas
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const balancerTokenAdminTask = new _src_1.Task('20220325-balancer-token-admin', _src_1.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        BALTokenAdmin = await balancerTokenAdminTask.deployedInstance('BalancerTokenAdmin');
        BAL = await BALTokenAdmin.getBalancerToken();
        const gaugeControllerTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
    });
    before('update balancer token admin rate', async () => {
        // We move forward past the BAL minting epoch, so that it doesn't fall in the middle of the 'multiple weeks' test,
        // resulting in variable rates.
        await (0, time_1.advanceTime)(time_1.WEEK * 5);
        await BALTokenAdmin.update_mining_parameters();
    });
    before('create veBAL whale', async () => {
        const veBALTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        veBAL = await veBALTask.instanceAt('VotingEscrow', veBALTask.output({ network: 'mainnet' }).VotingEscrow);
        const weightedPoolTask = new _src_1.Task('20210418-weighted-pool', _src_1.TaskMode.READ_ONLY, (0, _src_2.getForkedNetwork)(hardhat_1.default));
        bal80weth20Pool = await weightedPoolTask.instanceAt('WeightedPool2Tokens', VEBAL_POOL);
        const poolId = await bal80weth20Pool.getPoolId();
        await vault.connect(veBALHolder).joinPool(poolId, veBALHolder.address, veBALHolder.address, {
            assets: [BAL, constants_1.ZERO_ADDRESS],
            maxAmountsIn: [0, VAULT_BOUNTY],
            fromInternalBalance: false,
            userData: encoder_1.WeightedPoolEncoder.joinExactTokensInForBPTOut([0, VAULT_BOUNTY], 0),
        }, { value: VAULT_BOUNTY });
        await bal80weth20Pool.connect(veBALHolder).approve(veBAL.address, constants_1.MAX_UINT256);
        const currentTime = await (0, time_1.currentTimestamp)();
        await veBAL
            .connect(veBALHolder)
            .create_lock(await bal80weth20Pool.balanceOf(veBALHolder.address), currentTime.add(time_1.MONTH * 12));
    });
    it('create gauge', async () => {
        const tx = await factory.create(recipient.address, weightCap);
        const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
        gauge = await task.instanceAt('GnosisRootGauge', event.args.gauge);
        (0, chai_1.expect)(await factory.isGaugeFromFactory(gauge.address)).to.be.true;
        (0, chai_1.expect)(await gauge.getRecipient()).to.equal(recipient.address);
    });
    it('grant permissions', async () => {
        // We need to grant permission to the admin to add gauges to the GaugeController.
        const govMultisig = await (0, _src_3.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer
            .connect(govMultisig)
            .grantRole(await authorizerAdaptor.getActionId(gauge.interface.getSighash('checkpoint')), admin.address);
        await authorizer
            .connect(govMultisig)
            .grantRole(await authorizerAdaptor.getActionId(gaugeController.interface.getSighash('add_type(string,uint256)')), admin.address);
        await authorizer
            .connect(govMultisig)
            .grantRole(await authorizerAdaptor.getActionId(gaugeController.interface.getSighash('add_gauge(address,int128)')), admin.address);
    });
    it('add gauge to gauge controller', async () => {
        // Add gauge directly through the controller, since we can't use GaugeAdder V3 without the TimelockAuthorizer
        await authorizerAdaptor
            .connect(admin)
            .performAction(gaugeController.address, gaugeController.interface.encodeFunctionData('add_type(string,uint256)', ['Gnosis', 1]));
        await authorizerAdaptor
            .connect(admin)
            .performAction(gaugeController.address, gaugeController.interface.encodeFunctionData('add_gauge(address,int128)', [gauge.address, types_1.GaugeType.Gnosis]));
        (0, chai_1.expect)(await gaugeController.gauge_exists(gauge.address)).to.be.true;
    });
    it('vote for gauge', async () => {
        (0, chai_1.expect)(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
        (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(0);
        await gaugeController.connect(veBALHolder).vote_for_gauge_weights(gauge.address, 10000); // Max voting power is 10k points
        // We now need to go through an epoch for the votes to be locked in
        await (0, time_1.advanceTime)(time_1.DAY * 8);
        await gaugeController.checkpoint();
        // Gauge weight is equal to the cap, and controller weight for the gauge is greater than the cap.
        (0, chai_1.expect)(await gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, await (0, time_1.currentWeekTimestamp)())).to.be.gt(weightCap);
        (0, chai_1.expect)(await gauge.getCappedRelativeWeight(await (0, time_1.currentTimestamp)())).to.equal(weightCap);
    });
    it('mint & bridge tokens', async () => {
        // The gauge has votes for this week, and it will mint the first batch of tokens. We store the current gauge
        // relative weight, as it will change as time goes by due to vote decay.
        const firstMintWeekTimestamp = await (0, time_1.currentWeekTimestamp)();
        const calldata = gauge.interface.encodeFunctionData('checkpoint');
        // Even though the gauge has relative weight, it cannot mint yet as it needs for the epoch to finish
        const zeroMintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        expectEvent.inIndirectReceipt(await zeroMintTx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: firstMintWeekTimestamp.sub(time_1.WEEK),
            periodEmissions: 0,
        });
        // No token transfers are performed if the emissions are zero, but we can't test for a lack of those
        await (0, time_1.advanceTime)(time_1.WEEK);
        // The gauge should now mint and send all minted tokens to the Gnosis bridge
        const mintTx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        const event = expectEvent.inIndirectReceipt(await mintTx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: firstMintWeekTimestamp,
        });
        const actualEmissions = event.args.periodEmissions;
        // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge
        const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(time_1.WEEK);
        const expectedEmissions = weightCap.mul(weeklyRate).div(numbers_1.FP_ONE);
        (0, relativeError_1.expectEqualWithError)(actualEmissions, expectedEmissions, 0.001);
        // Tokens are minted for the gauge
        (0, expectTransfer_1.expectTransferEvent)(await mintTx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: gauge.address,
            value: actualEmissions,
        }, BAL);
        // And the gauge then deposits those in the predicate via the bridge mechanism
        const bridgeInterface = new hardhat_1.ethers.utils.Interface([
            'event TokensBridgingInitiated(address indexed token, address indexed sender, uint256 value, bytes32 indexed messageId)',
        ]);
        expectEvent.inIndirectReceipt(await mintTx.wait(), bridgeInterface, 'TokensBridgingInitiated', {
            token: BAL,
            sender: gauge.address,
            value: actualEmissions,
        });
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
        const expectedEmissions = weightCap.mul(numberOfWeeks).mul(weeklyRate).div(numbers_1.FP_ONE);
        const calldata = gauge.interface.encodeFunctionData('checkpoint');
        const tx = await authorizerAdaptor.connect(admin).performAction(gauge.address, calldata);
        await Promise.all((0, lodash_1.range)(1, numberOfWeeks + 1).map(async (weekIndex) => expectEvent.inIndirectReceipt(await tx.wait(), gauge.interface, 'Checkpoint', {
            periodTime: weekTimestamp.sub(time_1.WEEK * weekIndex),
        })));
        // Tokens are minted for the gauge
        const transferEvent = (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), {
            from: constants_1.ZERO_ADDRESS,
            to: gauge.address,
        }, BAL);
        (0, chai_1.expect)(transferEvent.args.value).to.be.almostEqual(expectedEmissions);
        // And the gauge then deposits those in the predicate via the bridge mechanism
        const bridgeInterface = new hardhat_1.ethers.utils.Interface([
            'event TokensBridgingInitiated(address indexed token, address indexed sender, uint256 value, bytes32 indexed messageId)',
        ]);
        const depositEvent = expectEvent.inIndirectReceipt(await tx.wait(), bridgeInterface, 'TokensBridgingInitiated', {
            token: BAL,
            sender: gauge.address,
        });
        (0, chai_1.expect)(depositEvent.args.value).to.be.almostEqual(expectedEmissions);
        // The TokensBridgingInitiated event unfortunately doesn't include the L2 recipient address, so we check that by
        // looking at some of the data encoded in the UserRequestForAffirmation event. Said data is relatively complicated,
        // but the last bytes seem to be the ABI encoding of (token, recipient, amount). This is based on the event at index
        // 261 of mainnet transaction 0x6a0dcbf72db757f83bf1c9b42e5f940c31e3240479614635fcbe5a5f72091692.
        const ambInterface = new hardhat_1.ethers.utils.Interface([
            'event UserRequestForAffirmation(bytes32 indexed messageId, bytes encodedData)',
        ]);
        const userRequestEvent = expectEvent.inIndirectReceipt(await tx.wait(), ambInterface, 'UserRequestForAffirmation');
        const expectedPartialEncodedData = abi_1.defaultAbiCoder.encode(['address', 'address', 'uint256'], [BAL, recipient.address, depositEvent.args.value]);
        // Remove the leading 0x when testing for substring inclusion
        (0, chai_1.expect)(userRequestEvent.args.encodedData).to.include(expectedPartialEncodedData.slice(2));
    });
});
