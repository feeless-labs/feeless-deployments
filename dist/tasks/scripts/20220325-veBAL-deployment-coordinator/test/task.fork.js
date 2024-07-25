"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const time_1 = require("@helpers/time");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
(0, _src_1.describeForkTest)('veBALDeploymentCoordinator', 'mainnet', 14458084, function () {
    let balMultisig, govMultisig;
    let coordinator, authorizer, BAL;
    let task;
    const BAL_TOKEN = '0xba100000625a3754423978a60c9317c58a424e3D';
    const BAL_MULTISIG = '0xCDcEBF1f28678eb4A1478403BA7f34C94F7dDBc5';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    before('run task', async () => {
        task = new _src_2.Task('20220325-veBAL-deployment-coordinator', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        coordinator = await task.deployedInstance('veBALDeploymentCoordinator');
    });
    before('grant permissions', async () => {
        balMultisig = await (0, _src_4.impersonate)(BAL_MULTISIG);
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG);
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizer = await vaultTask.instanceAt('Authorizer', await coordinator.getAuthorizer());
        // We reuse this task as it contains an ABI similar to the one in the real BAL token
        const testBALTokenTask = new _src_2.Task('20220325-test-balancer-token', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        BAL = await testBALTokenTask.instanceAt('TestBalancerToken', BAL_TOKEN);
        await authorizer
            .connect(govMultisig)
            .grantRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address);
        await BAL.connect(balMultisig).grantRole('0x0000000000000000000000000000000000000000000000000000000000000000', coordinator.address);
    });
    it('perform first stage', async () => {
        await (0, time_1.advanceToTimestamp)((await coordinator.getActivationScheduledTime()).add(1));
        await coordinator.performFirstStage();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(1);
    });
    it('perform second stage', async () => {
        await coordinator.performSecondStage();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(2);
    });
    it('perform third stage', async () => {
        await (0, time_1.advanceToTimestamp)((await coordinator.getActivationScheduledTime()).add(time_1.DAY * 10));
        await coordinator.performThirdStage();
        (0, chai_1.expect)(await coordinator.getCurrentDeploymentStage()).to.equal(3);
    });
});
