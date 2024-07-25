"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
exports.default = {
    mainnet: {
        VotingEscrowDelegationProxy: new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY).output({ network: 'mainnet' })
            .VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: true,
    },
    iotatestnet: {
        VotingEscrowDelegationProxy: new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY).output({ network: 'iotatestnet' })
            .VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: true,
    },
    polygon: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'polygon',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    arbitrum: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'arbitrum',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    optimism: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'optimism',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    gnosis: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'gnosis',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    avalanche: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'avalanche',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    zkevm: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'zkevm',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    base: {
        VotingEscrowDelegationProxy: new _src_1.Task('20230316-l2-ve-delegation-proxy', _src_1.TaskMode.READ_ONLY).output({
            network: 'base',
        }).VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: false,
    },
    goerli: {
        VotingEscrowDelegationProxy: new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY).output({ network: 'goerli' })
            .VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: true,
    },
    sepolia: {
        VotingEscrowDelegationProxy: new _src_1.Task('20220325-ve-delegation', _src_1.TaskMode.READ_ONLY).output({ network: 'sepolia' })
            .VotingEscrowDelegationProxy,
        ReadTotalSupplyFromVE: true,
    },
};
