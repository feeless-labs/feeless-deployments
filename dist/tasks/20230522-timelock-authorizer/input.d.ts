import { Task } from '@src';
import { DelayData, RoleData } from './input/types';
export type TimelockAuthorizerDeployment = {
    Authorizer: string;
    AuthorizerAdaptorEntrypoint: string;
    Root: string;
    RootTransferDelay: number;
    getRoles: () => Promise<RoleData[]>;
    Granters: RoleData[];
    Revokers: RoleData[];
    ExecuteDelays: DelayData[];
    GrantDelays: DelayData[];
};
export type TimelockAuthorizerDeploymentInputType = {
    Authorizer: Task;
    AuthorizerAdaptorEntrypoint: Task;
    networks: string[];
    [key: string]: any;
};
declare const input: TimelockAuthorizerDeploymentInputType;
export default input;
