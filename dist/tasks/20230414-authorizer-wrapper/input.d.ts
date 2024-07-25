import { Task } from '@src';
export type AuthorizerWithAdaptorValidationDeployment = {
    Vault: string;
    Authorizer: string;
    AuthorizerAdaptor: string;
    AuthorizerAdaptorEntrypoint: string;
};
declare const _default: {
    Vault: Task;
    Authorizer: Task;
    AuthorizerAdaptor: Task;
    AuthorizerAdaptorEntrypoint: Task;
};
export default _default;
