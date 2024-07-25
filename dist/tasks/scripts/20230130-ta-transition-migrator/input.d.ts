import { RoleData } from './input/types';
export declare const TRANSITION_START_BLOCK = 16085047;
export declare const TRANSITION_END_BLOCK = 16484500;
export type TimelockAuthorizerTransitionMigratorDeployment = {
    OldAuthorizer: string;
    NewAuthorizer: string;
    Roles: RoleData[];
    DelayedRoles: RoleData[];
};
declare const _default: {
    mainnet: {
        OldAuthorizer: string;
        NewAuthorizer: string;
        Roles: RoleData[];
        DelayedRoles: RoleData[];
    };
};
export default _default;
