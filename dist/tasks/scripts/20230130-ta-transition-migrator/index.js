"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransitionRoles = void 0;
const _src_1 = require("@src");
const input_1 = require("./input");
const constants_1 = require("@helpers/constants");
const mainnet_1 = require("./input/mainnet");
exports.default = async (task, { force, from } = {}) => {
    const input = task.input();
    const inputRoles = [...input.Roles, ...input.DelayedRoles];
    // Filter excluded roles in inputs file from on-chain roles.
    const onChainRoles = (await getTransitionRoles('mainnet', input_1.TRANSITION_START_BLOCK, input_1.TRANSITION_END_BLOCK)).filter((role) => !mainnet_1.excludedRoles.find((excludedRole) => isRoleEqual(excludedRole, role)));
    const onchainInputMatch = onChainRoles.every((cRole) => inputRoles.find((iRole) => isRoleEqual(cRole, iRole)));
    const inputOnchainMatch = inputRoles.every((iRole) => onChainRoles.find((cRole) => isRoleEqual(iRole, cRole)));
    const rolesMatch = onChainRoles.length === inputRoles.length && onchainInputMatch && inputOnchainMatch;
    if (!rolesMatch) {
        throw new Error('Input permissions do not match on-chain roles granted to old authorizer');
    }
    const args = [input.OldAuthorizer, input.NewAuthorizer, inputRoles];
    await task.deployAndVerify('TimelockAuthorizerTransitionMigrator', args, from, force);
};
/**
 * Gets permissions granted to the old authorizer between two given blocks.
 * @param network Target chain name.
 * @param fromBlock Starting block; permissions granted before it will be filtered out.
 * @param toBlock End block; permissions granted after it will be filtered out.
 * @returns Promise of array with role data containing granted permissions.
 */
async function getTransitionRoles(network, fromBlock, toBlock) {
    const OldAuthorizerTask = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY);
    const oldAuthorizerAddress = OldAuthorizerTask.output({ network }).Authorizer;
    const oldAuthorizer = await OldAuthorizerTask.instanceAt('Authorizer', oldAuthorizerAddress);
    const eventFilter = oldAuthorizer.filters.RoleGranted();
    const events = await oldAuthorizer.queryFilter(eventFilter, fromBlock, toBlock);
    // Old authorizer doesn't take into account the target, and on-chain permissions use DAO multisig address as a
    // sentinel value for the target.
    return events.map((e) => {
        var _a, _b;
        return ({
            role: (_a = e.args) === null || _a === void 0 ? void 0 : _a.role,
            grantee: (_b = e.args) === null || _b === void 0 ? void 0 : _b.account,
            target: constants_1.ANY_ADDRESS,
        });
    });
}
exports.getTransitionRoles = getTransitionRoles;
/**
 * Compare two `RoleData` objects by role and grantee, dismissing target.
 * On-chain roles use DAO multisig as a sentinel value since the old authorizer doesn't take the target address into
 * account. In other words, in the old authorizer all permissions are granted 'everywhere' no matter what the target is.
 * Therefore, we skip the target when comparing roles.
 * @param r1 First object to compare.
 * @param r2 Second object to compare.
 * @returns True if role and grantee (caps insensitive) are equal, false otherwise.
 */
function isRoleEqual(r1, r2) {
    return r1.role === r2.role && r1.grantee.toLowerCase() === r2.grantee.toLowerCase();
}
