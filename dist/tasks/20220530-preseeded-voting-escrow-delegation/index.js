"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [
        input.VotingEscrow,
        'VotingEscrow Delegation',
        'veBoost',
        '',
        input.AuthorizerAdaptor,
        input.PreseededBoostCalls.concat(new Array(10 - input.PreseededBoostCalls.length).fill({
            delegator: ZERO_ADDRESS,
            receiver: ZERO_ADDRESS,
            percentage: 0,
            cancel_time: 0,
            expire_time: 0,
            id: 0,
        })),
        input.PreseededApprovalCalls.concat(new Array(10 - input.PreseededApprovalCalls.length).fill({
            operator: ZERO_ADDRESS,
            delegator: ZERO_ADDRESS,
        })),
    ];
    await task.deploy('PreseededVotingEscrowDelegation', args, from, force);
};
