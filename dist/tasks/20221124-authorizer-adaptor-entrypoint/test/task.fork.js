"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('AuthorizerAdaptorEntrypoint', 'mainnet', 16041900, function () {
    let adaptorEntrypoint, vault, authorizerAdaptor, authorizer;
    let task;
    before('run task', async () => {
        task = new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        adaptorEntrypoint = await task.deployedInstance('AuthorizerAdaptorEntrypoint');
    });
    before('setup contracts', async () => {
        vault = await new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Vault');
        authorizer = await new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('Authorizer');
        authorizerAdaptor = await new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default)).deployedInstance('AuthorizerAdaptor');
    });
    describe('constructor', () => {
        it('checks vault address', async () => {
            const entrypointVault = await adaptorEntrypoint.getVault();
            (0, chai_1.expect)(entrypointVault).to.equal(vault.address);
        });
        it('checks authorizer address', async () => {
            const entrypointAuthorizer = await adaptorEntrypoint.getAuthorizer();
            (0, chai_1.expect)(entrypointAuthorizer).to.equal(authorizer.address);
        });
        it('checks authorizer adaptor address', async () => {
            const entrypointAuthorizerAdaptor = await adaptorEntrypoint.getAuthorizerAdaptor();
            (0, chai_1.expect)(entrypointAuthorizerAdaptor).to.equal(authorizerAdaptor.address);
        });
    });
});
