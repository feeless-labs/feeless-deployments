"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    if (task.network != 'arbitrum')
        throw new Error('Attempting to deploy MCDEX MerkleRedeem on the wrong network (should be arbitrum)');
    const input = task.input();
    const args = [input.Vault, input.rewardToken];
    await task.deployAndVerify('MerkleRedeem', args, from, force);
};
