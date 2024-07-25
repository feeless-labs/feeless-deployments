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
const expectEvent = __importStar(require("@helpers/expectEvent"));
const constants_1 = require("@helpers/constants");
const time_1 = require("@helpers/time");
const TimelockAuthorizerDeployer_1 = __importDefault(require("./TimelockAuthorizerDeployer"));
class TimelockAuthorizer {
    static async create(deployment = {}) {
        return TimelockAuthorizerDeployer_1.default.deploy(deployment);
    }
    constructor(instance, root) {
        this.instance = instance;
        this.root = root;
    }
    get address() {
        return this.instance.address;
    }
    get interface() {
        return this.instance.interface;
    }
    async hasPermission(action, account, where) {
        return this.instance.hasPermission(action, this.toAddress(account), this.toAddress(where));
    }
    async getPermissionId(action, account, where) {
        return this.instance.getPermissionId(action, this.toAddress(account), this.toAddress(where));
    }
    async isRoot(account) {
        return this.instance.isRoot(this.toAddress(account));
    }
    async isPendingRoot(account) {
        return this.instance.isPendingRoot(this.toAddress(account));
    }
    async isExecutor(scheduledExecutionId, account) {
        return this.instance.isExecutor(scheduledExecutionId, this.toAddress(account));
    }
    async isCanceler(scheduledExecutionId, account) {
        return this.instance.isCanceler(scheduledExecutionId, this.toAddress(account));
    }
    async delay(action) {
        return this.instance.getActionIdDelay(action);
    }
    async getActionIdRevokeDelay(actionId) {
        return this.instance.getActionIdRevokeDelay(actionId);
    }
    async getActionIdGrantDelay(actionId) {
        return this.instance.getActionIdGrantDelay(actionId);
    }
    async getScheduledExecution(id) {
        return this.instance.getScheduledExecution(id);
    }
    async canPerform(action, account, where) {
        return this.instance.canPerform(action, this.toAddress(account), this.toAddress(where));
    }
    async isGranter(actionId, account, where) {
        return this.instance.isGranter(actionId, this.toAddress(account), this.toAddress(where));
    }
    async isRevoker(account, where) {
        return this.instance.isRevoker(this.toAddress(account), this.toAddress(where));
    }
    async scheduleRootChange(root, executors, params) {
        const receipt = await this.with(params).scheduleRootChange(this.toAddress(root), this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'RootChangeScheduled', {
            newRoot: this.toAddress(root),
        });
        return event.args.scheduledExecutionId;
    }
    async claimRoot(params) {
        return this.with(params).claimRoot();
    }
    async scheduleDelayChange(action, delay, executors, params) {
        const receipt = await this.with(params).scheduleDelayChange(action, delay, this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'DelayChangeScheduled', {
            actionId: action,
            newDelay: delay,
        });
        return event.args.scheduledExecutionId;
    }
    async scheduleGrantDelayChange(action, delay, executors, params) {
        const receipt = await this.with(params).scheduleGrantDelayChange(action, delay, this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'GrantDelayChangeScheduled', {
            actionId: action,
            newDelay: delay,
        });
        return event.args.scheduledExecutionId;
    }
    async scheduleRevokeDelayChange(action, delay, executors, params) {
        const receipt = await this.with(params).scheduleRevokeDelayChange(action, delay, this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'RevokeDelayChangeScheduled', {
            actionId: action,
            newDelay: delay,
        });
        return event.args.scheduledExecutionId;
    }
    async schedule(where, data, executors, params) {
        const receipt = await this.with(params).schedule(this.toAddress(where), data, this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
        return event.args.scheduledExecutionId;
    }
    async scheduleGrantPermission(action, account, where, executors, params) {
        const receipt = await this.with(params).scheduleGrantPermission(action, this.toAddress(account), this.toAddress(where), this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'GrantPermissionScheduled', {
            actionId: action,
            account: this.toAddress(account),
            where: this.toAddress(where),
        });
        return event.args.scheduledExecutionId;
    }
    async scheduleRevokePermission(action, account, where, executors, params) {
        const receipt = await this.with(params).scheduleRevokePermission(action, this.toAddress(account), this.toAddress(where), this.toAddresses(executors));
        const event = expectEvent.inReceipt(await receipt.wait(), 'RevokePermissionScheduled', {
            actionId: action,
            account: this.toAddress(account),
            where: this.toAddress(where),
        });
        return event.args.scheduledExecutionId;
    }
    async execute(id, params) {
        return this.with(params).execute(id);
    }
    async cancel(id, params) {
        return this.with(params).cancel(id);
    }
    async addCanceler(scheduledExecutionId, account, params) {
        return this.with(params).addCanceler(scheduledExecutionId, this.toAddress(account));
    }
    async removeCanceler(scheduledExecutionId, account, params) {
        return this.with(params).removeCanceler(scheduledExecutionId, this.toAddress(account));
    }
    async addGranter(action, account, where, params) {
        return this.with(params).addGranter(action, this.toAddress(account), this.toAddress(where));
    }
    async removeGranter(action, account, wheres, params) {
        return this.with(params).removeGranter(action, this.toAddress(account), this.toAddress(wheres));
    }
    async addRevoker(account, where, params) {
        return this.with(params).addRevoker(this.toAddress(account), this.toAddress(where));
    }
    async removeRevoker(account, wheres, params) {
        return this.with(params).removeRevoker(this.toAddress(account), this.toAddress(wheres));
    }
    async grantPermission(action, account, where, params) {
        return this.with(params).grantPermission(action, this.toAddress(account), this.toAddress(where));
    }
    async revokePermission(action, account, where, params) {
        return this.with(params).revokePermission(action, this.toAddress(account), this.toAddress(where));
    }
    async renouncePermission(action, where, params) {
        return this.with(params).renouncePermission(action, this.toAddress(where));
    }
    async grantPermissionGlobally(action, account, params) {
        return this.with(params).grantPermission(action, this.toAddress(account), TimelockAuthorizer.EVERYWHERE);
    }
    async revokePermissionGlobally(action, account, params) {
        return this.with(params).revokePermission(action, this.toAddress(account), TimelockAuthorizer.EVERYWHERE);
    }
    async renouncePermissionGlobally(action, params) {
        return this.with(params).renouncePermission(action, TimelockAuthorizer.EVERYWHERE);
    }
    async scheduleAndExecuteDelayChange(action, delay, params) {
        const id = await this.scheduleDelayChange(action, delay, [], params);
        await (0, time_1.advanceToTimestamp)((await this.getScheduledExecution(id)).executableAt);
        await this.execute(id);
    }
    async scheduleAndExecuteGrantDelayChange(action, delay, params) {
        const id = await this.scheduleGrantDelayChange(action, delay, [], params);
        await (0, time_1.advanceToTimestamp)((await this.getScheduledExecution(id)).executableAt);
        await this.execute(id);
    }
    async scheduleAndExecuteRevokeDelayChange(action, delay, params) {
        const id = await this.scheduleRevokeDelayChange(action, delay, [], params);
        await (0, time_1.advanceToTimestamp)((await this.getScheduledExecution(id)).executableAt);
        await this.execute(id);
    }
    toAddress(account) {
        return typeof account === 'string' ? account : account.address;
    }
    toAddresses(accounts) {
        return this.toList(accounts).map(this.toAddress);
    }
    toList(items) {
        return Array.isArray(items) ? items : [items];
    }
    with(params = {}) {
        return params.from ? this.instance.connect(params.from) : this.instance;
    }
}
exports.default = TimelockAuthorizer;
TimelockAuthorizer.EVERYWHERE = constants_1.ANY_ADDRESS;
