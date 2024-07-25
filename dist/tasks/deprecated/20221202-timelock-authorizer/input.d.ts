import { Task } from '@src';
import { DelayData, RoleData } from './input/types';
export type TimelockAuthorizerDeployment = {
    Authorizer: string;
    AuthorizerAdaptorEntrypoint: string;
    Root: string;
    Roles: RoleData[];
    Granters: RoleData[];
    Revokers: RoleData[];
    ExecuteDelays: DelayData[];
    GrantDelays: DelayData[];
};
declare const _default: {
    Authorizer: Task;
    AuthorizerAdaptorEntrypoint: Task;
    mainnet: {
        Root: string;
        Roles: RoleData[];
        Granters: RoleData[];
        Revokers: RoleData[];
        ExecuteDelays: DelayData[];
        GrantDelays: DelayData[];
    };
    goerli: {
        Root: string;
        Roles: never[];
        Granters: never[];
        Revokers: never[];
        ExecuteDelays: never[];
        GrantDelays: never[];
    };
};
export default _default;
