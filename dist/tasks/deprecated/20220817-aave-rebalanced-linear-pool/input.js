"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const BalancerQueries = new _src_1.Task('20220721-balancer-queries', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    BalancerQueries,
};
