"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Authorizer = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptorEntrypoint = new _src_1.Task('20221124-authorizer-adaptor-entrypoint', _src_1.TaskMode.READ_ONLY);
/* eslint-enable @typescript-eslint/no-explicit-any */
const input = {
    Authorizer,
    AuthorizerAdaptorEntrypoint,
    networks: ['goerli', 'sepolia'],
};
// Include input files for each network inside global inputs.
input.networks.forEach((network) => {
    input[network] = require(`./input/${network}.ts`);
});
exports.default = input;
