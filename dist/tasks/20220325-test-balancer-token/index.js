"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const args = [input.Admin, 'Balancer Governance Token', 'BAL'];
    await task.deployAndVerify('TestBalancerToken', args, from, force);
};
