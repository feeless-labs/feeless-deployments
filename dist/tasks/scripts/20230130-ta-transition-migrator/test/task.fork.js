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
const sharedBeforeEach_1 = require("@helpers/sharedBeforeEach");
const numbers_1 = require("@helpers/numbers");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const input_1 = require("../input");
const time_1 = require("@helpers/time");
(0, _src_1.describeForkTest)('TimelockAuthorizerTransitionMigrator', 'mainnet', input_1.TRANSITION_END_BLOCK, function () {
    let input;
    let migrator, newAuthorizer;
    let root;
    let task;
    let roles, delayedRoles;
    let migrationReceipt;
    before('run task', async () => {
        task = new _src_2.Task('20230130-ta-transition-migrator', _src_2.TaskMode.TEST, (0, _src_4.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        migrator = await task.deployedInstance('TimelockAuthorizerTransitionMigrator');
        input = task.input();
        roles = input.Roles;
        delayedRoles = input.DelayedRoles;
    });
    before('load old authorizer and impersonate multisig', async () => {
        const TimelockAuthorizerTask = new _src_2.Task('20221202-timelock-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_4.getForkedNetwork)(hardhat_1.default));
        newAuthorizer = await TimelockAuthorizerTask.deployedInstance('TimelockAuthorizer');
        root = await (0, _src_3.impersonate)(await newAuthorizer.getRoot(), (0, numbers_1.fp)(100));
    });
    before('check that permissions were not present in the new authorizer', async () => {
        for (const roleData of roles) {
            (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.false;
        }
    });
    before('make the migrator a granter by governance', async () => {
        await newAuthorizer
            .connect(root)
            .manageGranter(newAuthorizer.GENERAL_PERMISSION_SPECIFIER(), migrator.address, newAuthorizer.EVERYWHERE(), true);
        (0, chai_1.expect)(await newAuthorizer.canGrant(newAuthorizer.GENERAL_PERMISSION_SPECIFIER(), migrator.address, newAuthorizer.EVERYWHERE())).to.be.true;
    });
    (0, sharedBeforeEach_1.sharedBeforeEach)(async () => {
        migrationReceipt = await (await migrator.migratePermissions()).wait();
    });
    it('migrates all non-delayed roles properly', async () => {
        for (const roleData of roles) {
            (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.true;
        }
    });
    it('schedules delayed roles', async () => {
        for (let i = 0; i < delayedRoles.length; ++i) {
            const roleData = delayedRoles[i];
            (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.false;
            const grantActionId = await newAuthorizer.getGrantPermissionActionId(roleData.role);
            expectEvent.inIndirectReceipt(migrationReceipt, newAuthorizer.interface, 'ExecutionScheduled', {
                actionId: grantActionId,
                scheduledExecutionId: await migrator.scheduledExecutionIds(i),
            }, newAuthorizer.address);
        }
    });
    // The only expected delayed role (see mainnet.ts) is the following (14 days):
    // GaugeController.actionId('GaugeController', 'add_gauge(address,int128)')
    it('skips executions while delay is not due', async () => {
        await (0, time_1.advanceTime)(7 * time_1.DAY);
        const tx = await migrator.executeDelays();
        expectEvent.notEmitted(await tx.wait(), 'ExecutionExecuted');
        for (const roleData of delayedRoles) {
            (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.false;
        }
    });
    it('executes delayed permissions after their delay passes', async () => {
        await (0, time_1.advanceTime)(14 * time_1.DAY); // 14 days since `migratePermissions` is called.
        const receipt = await (await migrator.executeDelays()).wait();
        for (let i = 0; i < delayedRoles.length; ++i) {
            const roleData = delayedRoles[i];
            (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.true;
            expectEvent.inIndirectReceipt(receipt, newAuthorizer.interface, 'ExecutionExecuted', {
                scheduledExecutionId: await migrator.scheduledExecutionIds(i),
            });
        }
    });
    it('does nothing when executing delays the second time', async () => {
        await (0, time_1.advanceTime)(14 * time_1.DAY); // 14 days since `migratePermissions` is called.
        await migrator.executeDelays();
        const receipt = await (await migrator.executeDelays()).wait();
        for (let i = 0; i < delayedRoles.length; ++i) {
            const roleData = delayedRoles[i];
            (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.true;
        }
        expectEvent.notEmitted(receipt, 'ExecutionExecuted');
    });
    it('reverts after migrating the first time', async () => {
        await (0, chai_1.expect)(migrator.migratePermissions()).to.be.revertedWith('ALREADY_MIGRATED');
    });
    it('renounces its granter role after migrating permissions', async () => {
        (0, chai_1.expect)(await newAuthorizer.canGrant(newAuthorizer.GENERAL_PERMISSION_SPECIFIER(), migrator.address, newAuthorizer.EVERYWHERE())).to.be.false;
    });
});
