"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const authorizerArgs = [input.Authorizer, input.AuthorizerAdaptor, input.AuthorizerAdaptorEntrypoint];
    await task.deployAndVerify('AuthorizerWithAdaptorValidation', authorizerArgs, from, force);
};
