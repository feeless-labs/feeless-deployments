"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const query = await task.deployAndVerify('QueryProcessor', [], from, force);
    const input = task.input();
    const args = [input.Vault];
    await task.deployAndVerify('MetaStablePoolFactory', args, from, force, { QueryProcessor: query.address });
};
