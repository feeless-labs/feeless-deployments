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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const constants_1 = require("@helpers/constants");
const lodash_1 = require("lodash");
const actions_1 = require("@helpers/models/misc/actions");
const time_1 = require("@helpers/time");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('PreseededVotingEscrowDelegation', 'mainnet', 14850000, function () {
    let oldDelegation;
    let receiver;
    let delegation;
    let task;
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_1.Task('20220530-preseeded-voting-escrow-delegation', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        delegation = await task.deployedInstance('PreseededVotingEscrowDelegation');
    });
    before('setup signers', async () => {
        receiver = await (0, _src_1.getSigner)(1);
    });
    it('proxy can be migrated to delegation', async () => {
        const delegationProxyTask = new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        const delegationProxy = await delegationProxyTask.deployedInstance('VotingEscrowDelegationProxy');
        oldDelegation = await delegationProxyTask.instanceAt('VotingEscrowDelegation', await delegationProxy.getDelegationImplementation());
        const authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        const govMultisig = await (0, _src_1.impersonate)(GOV_MULTISIG);
        await authorizer
            .connect(govMultisig)
            .grantRole(await (0, actions_1.actionId)(delegationProxy, 'setDelegation'), govMultisig.address);
        await delegationProxy.connect(govMultisig).setDelegation(delegation.address);
    });
    it('preseeds boosts and approvals', async () => {
        const receipt = await (await delegation.preseed()).wait();
        for (const i in (0, lodash_1.range)(10)) {
            const boostCall = await delegation.preseeded_boost_calls(i);
            if (boostCall.delegator != constants_1.ZERO_ADDRESS) {
                expectEvent.inReceipt(receipt, 'DelegateBoost', {
                    _delegator: boostCall.delegator,
                    _receiver: boostCall.receiver,
                    _cancel_time: boostCall.cancel_time,
                    _expire_time: boostCall.expire_time,
                });
            }
            const approvalCall = await delegation.preseeded_approval_calls(i);
            if (approvalCall.delegator != constants_1.ZERO_ADDRESS) {
                expectEvent.inReceipt(receipt, 'ApprovalForAll', {
                    _owner: approvalCall.delegator,
                    _operator: approvalCall.operator,
                    _approved: true,
                });
            }
        }
    });
    it('mints boosts for all accounts that had a boost', async () => {
        const oldTotalSupply = await oldDelegation.totalSupply();
        let cancelledTokens = 0;
        for (const i in (0, lodash_1.range)(oldTotalSupply)) {
            const id = await oldDelegation.tokenByIndex(i);
            // Any cancelled boosts will still show up in the token enumeration (as the token is not burned), but will have a
            // zero expiration time. We simply skip those, since cancelled boosts are not recreated in the preseeded contract.
            if ((await oldDelegation.token_expiry(id)).isZero()) {
                cancelledTokens += 1;
                continue;
            }
            (0, chai_1.expect)(await oldDelegation.ownerOf(id)).to.equal(await delegation.ownerOf(id));
            (0, chai_1.expect)(await oldDelegation.token_expiry(id)).to.equal(await delegation.token_expiry(id));
            (0, chai_1.expect)(await oldDelegation.token_cancel_time(id)).to.equal(await delegation.token_cancel_time(id));
            // Ideally we'd also check delegator and boost amount, but there's no easy way to get the delegator, and boost
            // amounts might not match if the delegator has locked more veBAL after the boost creation, resulting in the
            // preseeded delegation using that extra veBAL in the new boost.
        }
        (0, chai_1.expect)(await delegation.totalSupply()).to.equal(oldTotalSupply.sub(cancelledTokens));
    });
    it('the Tribe operator can create boosts for the DAO', async () => {
        // From https://forum.balancer.fi/t/tribe-dao-boost-delegation/3218
        const TRIBE_DAO = '0xc4EAc760C2C631eE0b064E39888b89158ff808B2';
        const TRIBE_OPERATOR = '0x66977ce30049cd0e443216bf26377966c3a109e2';
        const operator = await (0, _src_1.impersonate)(TRIBE_OPERATOR);
        const receipt = await (await delegation.connect(operator).create_boost(TRIBE_DAO, receiver.address, 1000, 0, await (0, time_1.fromNow)(time_1.MONTH), 0)).wait();
        expectEvent.inReceipt(receipt, 'DelegateBoost', {
            _delegator: TRIBE_DAO,
            _receiver: receiver.address,
        });
    });
});
