"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const ethers_1 = require("ethers");
const chai_1 = require("chai");
const constants_1 = require("@helpers/constants");
const actions_1 = require("@helpers/models/misc/actions");
const _src_1 = require("@src");
const numbers_1 = require("@helpers/numbers");
(0, _src_1.describeForkTest)('L2VeBoostV2', 'arbitrum', 94139000, function () {
    let delegation, delegationProxy, authorizer;
    let task;
    const GOV_MULTISIG = '0xaF23DC5983230E9eEAf93280e312e57539D098D0';
    const VEBAL_HOLDER = '0xA2e7002E0FFC42e4228292D67C13a81FDd191870';
    // To verify that all the components (`VotingEscrowDelegationProxy`, `VeBoostV2` and `OmniVotingEscrowChild`) are
    // interacting properly, two messages were sent from mainnet to Arbitrum before the fork test's block number:
    // one for the total supply, and one for the balance of a veBAL holder.
    // These messages were the only ones to reach the `OmniVotingEscrowChild` up to this point; this can be verified
    // in the nonces shown in the `layerzeroscan` links below.
    // The veBAL balances for every other account that is not the transferred one should be 0.
    // OmniVotingEscrow `sendTotalSupply` tx: https://etherscan.io/tx/0x7ff2dc7000f167323ccfdfb3d84547f6cd5a0bd628a35baf76684aa5aec21e5b
    // LZ total supply transfer:
    // https://layerzeroscan.com/101/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/message/110/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/nonce/1
    // OmniVotingEscrow `sendUserBalance` tx: https://etherscan.io/tx/0x33df7240e54435d805285eec72e25885e7bedaccd3a1a0a56379d96380f31f5f
    // LZ user balance transfer:
    // https://layerzeroscan.com/101/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/message/110/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/nonce/2
    before('run task', async () => {
        task = new _src_1.Task('20230525-l2-veboost-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        delegation = await task.deployedInstance('VeBoostV2');
    });
    before('setup contracts', async () => {
        const delegationProxyTask = new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        delegationProxy = await delegationProxyTask.deployedInstance('VotingEscrowDelegationProxy');
        const authorizerTask = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        authorizer = await authorizerTask.deployedInstance('Authorizer');
    });
    it('returns null V1 delegation', async () => {
        (0, chai_1.expect)(await delegation.BOOST_V1()).to.be.eq(constants_1.ZERO_ADDRESS);
    });
    it('proxy can be migrated to delegation', async () => {
        const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(delegationProxy, 'setDelegation'), govMultisig.address);
        await delegationProxy.connect(govMultisig).setDelegation(delegation.address);
        (0, chai_1.expect)(await delegationProxy.getDelegationImplementation()).to.be.eq(delegation.address);
    });
    it('reverts migrating boosts (nothing to migrate)', async () => {
        await (0, chai_1.expect)(delegation.migrate((0, numbers_1.bn)(0))).to.be.reverted;
    });
    it('gets transferred total supply via delegation proxy', async () => {
        // Exact total supply decays with time, and depends on block time.
        // This is an approximate value fetched from Etherscan at around the time the data was transferred.
        (0, chai_1.expect)(await delegationProxy.totalSupply()).to.be.almostEqual(ethers_1.BigNumber.from('10182868869854932315839099'));
    });
    it('gets transferred user balance via delegation proxy', async () => {
        // Exact user balance decays with time, and depends on block time.
        // This is an approximate value fetched from Etherscan at around the time the data was transferred.
        // Most importantly, it's not 0.
        (0, chai_1.expect)(await delegationProxy.adjustedBalanceOf(VEBAL_HOLDER)).to.be.almostEqual(ethers_1.BigNumber.from('11458834346686284'));
    });
});
