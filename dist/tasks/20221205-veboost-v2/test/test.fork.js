"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const constants_1 = require("@helpers/constants");
const actions_1 = require("@helpers/models/misc/actions");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('veBoostV2', 'mainnet', 16110000, function () {
    let oldDelegation;
    let delegation;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const existingBoosts = [
        '0x7f01d9b227593e033bf8d6fc86e634d27aa85568000000000000000000000000',
        '0xc2593e6a71130e7525ec3e64ba7795827086df0a000000000000000000000000',
        '0xef9a40f0ce782108233b6a5d8fef08c89b01a7bd000000000000000000000000',
        '0x0035fc5208ef989c28d47e552e92b0c507d2b318000000000000000000000000',
        '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000005abf',
    ];
    before('run task', async () => {
        task = new _src_1.Task('20221205-veboost-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        delegation = await task.deployedInstance('VeBoostV2');
        oldDelegation = await new _src_1.Task('20220530-preseeded-voting-escrow-delegation', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('PreseededVotingEscrowDelegation');
    });
    it('no unexpected boosts exist on old veBoost contract', async () => {
        const totalSupply = await oldDelegation.totalSupply();
        (0, chai_1.expect)(existingBoosts.length).to.be.eq(totalSupply);
    });
    it('proxy can be migrated to delegation', async () => {
        const delegationProxy = await new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('VotingEscrowDelegationProxy');
        const authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(delegationProxy, 'setDelegation'), govMultisig.address);
        await delegationProxy.connect(govMultisig).setDelegation(delegation.address);
        (0, chai_1.expect)(await delegationProxy.getDelegationImplementation()).to.be.eq(delegation.address);
    });
    it('allows existing boosts to be migrated', async () => {
        const migrateArgs = Array.from({ length: 16 }, (_, i) => { var _a; return (_a = existingBoosts[i]) !== null && _a !== void 0 ? _a : constants_1.ZERO_BYTES32; });
        await delegation.migrate_many(migrateArgs);
        for (const tokenId of existingBoosts) {
            (0, chai_1.expect)(await delegation.migrated(tokenId)).to.be.true;
        }
    });
    it('adjusted balances should be unchanged', async () => {
        for (const tokenId of existingBoosts) {
            const boostSender = tokenId.slice(0, 42);
            const preMigrationAdjustedBalanceSender = await oldDelegation.adjusted_balance_of(boostSender);
            const postMigrationAdjustedBalanceSender = await oldDelegation.adjusted_balance_of(boostSender);
            (0, chai_1.expect)(postMigrationAdjustedBalanceSender).to.be.eq(preMigrationAdjustedBalanceSender);
            const boostReceiver = await oldDelegation.ownerOf(tokenId);
            const preMigrationAdjustedBalanceReceiver = await oldDelegation.adjusted_balance_of(boostReceiver);
            const postMigrationAdjustedBalanceReceiver = await oldDelegation.adjusted_balance_of(boostReceiver);
            (0, chai_1.expect)(postMigrationAdjustedBalanceReceiver).to.be.eq(preMigrationAdjustedBalanceReceiver);
            // Assumes that senders and receivers are 1:1.
            const delegatedBalance = await delegation.delegated_balance(boostSender);
            const receivedBalance = await delegation.received_balance(boostReceiver);
            (0, chai_1.expect)(delegatedBalance).to.be.gt(0);
            (0, chai_1.expect)(delegatedBalance).to.be.eq(receivedBalance);
        }
    });
});
