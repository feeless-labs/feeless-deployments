"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const mainnet_1 = require("./input/mainnet");
const Authorizer = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptorEntrypoint = new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Authorizer,
    AuthorizerAdaptorEntrypoint,
    mainnet: {
        Root: mainnet_1.root,
        Roles: mainnet_1.roles,
        Granters: mainnet_1.granters,
        Revokers: mainnet_1.revokers,
        ExecuteDelays: mainnet_1.executeDelays,
        GrantDelays: mainnet_1.grantDelays,
    },
    goerli: {
        Root: '0x171C0fF5943CE5f133130436A29bF61E26516003',
        Roles: [],
        Granters: [],
        Revokers: [],
        ExecuteDelays: [],
        GrantDelays: [],
    },
};
