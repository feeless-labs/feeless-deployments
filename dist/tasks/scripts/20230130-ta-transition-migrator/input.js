"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSITION_END_BLOCK = exports.TRANSITION_START_BLOCK = void 0;
const _src_1 = require("@src");
const mainnet_1 = require("./input/mainnet");
// Start: block that contains the transaction that deployed the `TimelockAuthorizer`.
// https://etherscan.io/tx/0x20eb23f4393fd592240ec788f44fb9658cc6ef487b88398e9b76c910294c4eae
// End: close to the current block at the time the `TimelockAuthorizerTransitionMigrator` is deployed.
// It is expected that no roles were granted to the old authorizer after it.
exports.TRANSITION_START_BLOCK = 16085047;
exports.TRANSITION_END_BLOCK = 16484500;
const OldAuthorizer = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY);
const NewAuthorizer = new _src_1.Task('20221202-timelock-authorizer', _src_1.TaskMode.READ_ONLY);
exports.default = {
    mainnet: {
        OldAuthorizer: OldAuthorizer.output({ network: 'mainnet' }).Authorizer,
        NewAuthorizer: NewAuthorizer.output({ network: 'mainnet' }).TimelockAuthorizer,
        Roles: mainnet_1.roles,
        DelayedRoles: mainnet_1.delayedRoles,
    },
};
