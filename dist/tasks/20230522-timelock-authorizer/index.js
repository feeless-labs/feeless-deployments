"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const migrator = await task.deployAndVerify('TimelockAuthorizerMigrator', [
        input.Root,
        input.Authorizer,
        input.AuthorizerAdaptorEntrypoint,
        input.RootTransferDelay,
        await input.getRoles(),
        input.Granters,
        input.Revokers,
        input.ExecuteDelays,
        input.GrantDelays,
    ], from, force);
    const authorizer = await task.instanceAt('TimelockAuthorizer', await migrator.newAuthorizer());
    const authorizerArgs = [migrator.address, input.Root, input.AuthorizerAdaptorEntrypoint, input.RootTransferDelay];
    await task.verify('TimelockAuthorizer', authorizer.address, authorizerArgs);
    task.save({ TimelockAuthorizer: authorizer });
    const executor = await task.instanceAt('TimelockExecutionHelper', await authorizer.getTimelockExecutionHelper());
    await task.verify('TimelockExecutionHelper', executor.address, []);
};
