"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const addRemoveTokenLib = await task.deployAndVerify('ManagedPoolAddRemoveTokenLib', [], from, force);
    const circuitBreakerLib = await task.deployAndVerify('CircuitBreakerLib', [], from, force);
    const args = [input.Vault, input.ProtocolFeePercentagesProvider];
    const factory = await task.deployAndVerify('ManagedPoolFactory', args, from, force, {
        CircuitBreakerLib: circuitBreakerLib.address,
        ManagedPoolAddRemoveTokenLib: addRemoveTokenLib.address,
    });
    const math = await factory.getWeightedMath();
    await task.verify('ExternalWeightedMath', math, []);
};
