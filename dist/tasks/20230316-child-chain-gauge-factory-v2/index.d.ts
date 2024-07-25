import { Task, TaskRunOptions } from '@src';
export type ExtraInputs = {
    VotingEscrowDelegationProxy: string;
    L2BalancerPseudoMinter: string;
};
declare const _default: (task: Task, { force, from }?: TaskRunOptions) => Promise<void>;
export default _default;
