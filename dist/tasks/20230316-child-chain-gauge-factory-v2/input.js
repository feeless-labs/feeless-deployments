"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const VotingEscrowDelegationProxy = new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY);
const AuthorizerAdaptor = new _src_1.Task('20220325-authorizer-adaptor', _src_1.TaskMode.READ_ONLY);
const L2BalancerPseudoMinter = new _src_1.Task('20230316-l2-balancer-pseudo-minter', _src_1.TaskMode.READ_ONLY);
const BaseVersion = { version: 2, deployment: '20230316-child-chain-gauge-factory-v2' };
exports.default = {
    VotingEscrowDelegationProxy,
    AuthorizerAdaptor,
    L2BalancerPseudoMinter,
    FactoryVersion: JSON.stringify({ name: 'ChildChainGaugeFactory', ...BaseVersion }),
    ProductVersion: JSON.stringify({ name: 'ChildChainGauge', ...BaseVersion }),
};
