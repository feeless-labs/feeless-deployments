"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const Authorizer = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptorEntrypoint = new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    Authorizer,
    AuthorizerAdaptor,
    AuthorizerAdaptorEntrypoint,
};
