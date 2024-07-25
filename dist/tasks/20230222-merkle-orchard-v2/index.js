"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const merkleOrchardArgs = [input.Vault];
    await task.deployAndVerify('MerkleOrchard', merkleOrchardArgs, from, force);
};
