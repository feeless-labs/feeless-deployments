"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const actions_1 = require("@helpers/models/misc/actions");
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const input_1 = __importDefault(require("../input"));
function doForkTestsOnNetwork(network, block) {
    (0, _src_1.describeForkTest)(`TimelockAuthorizer ${network}`, network, block, function () {
        let input;
        let migrator, vault, newAuthorizer, oldAuthorizer;
        let root;
        let task;
        before('run task', async () => {
            task = new _src_2.Task('20230522-timelock-authorizer', _src_2.TaskMode.TEST, (0, _src_4.getForkedNetwork)(hardhat_1.default));
            await task.run({ force: true });
            input = task.input();
            migrator = await task.deployedInstance('TimelockAuthorizerMigrator');
            newAuthorizer = await task.deployedInstance('TimelockAuthorizer');
            root = await (0, _src_3.impersonate)(input.Root, (0, numbers_1.fp)(100));
        });
        before('load vault', async () => {
            const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_4.getForkedNetwork)(hardhat_1.default));
            vault = await vaultTask.instanceAt('Vault', await migrator.vault());
        });
        before('load old authorizer and impersonate multisig', async () => {
            const authorizerTask = new _src_2.Task('20210418-authorizer', _src_2.TaskMode.READ_ONLY, (0, _src_4.getForkedNetwork)(hardhat_1.default));
            oldAuthorizer = await authorizerTask.instanceAt('Authorizer', await migrator.oldAuthorizer());
            const multisig = await (0, _src_3.impersonate)(input.Root, (0, numbers_1.fp)(100));
            const setAuthorizerActionId = await (0, actions_1.actionId)(vault, 'setAuthorizer');
            await oldAuthorizer.connect(multisig).grantRolesToMany([setAuthorizerActionId], [migrator.address]);
        });
        it('migrates all roles properly', async () => {
            for (const roleData of await input.getRoles()) {
                (0, chai_1.expect)(await newAuthorizer.hasPermission(roleData.role, roleData.grantee, roleData.target)).to.be.true;
            }
        });
        it('sets up granters properly', async () => {
            for (const granterData of input.Granters) {
                (0, chai_1.expect)(await newAuthorizer.isGranter(granterData.role, granterData.grantee, granterData.target)).to.be.true;
            }
        });
        it('sets up revokers properly', async () => {
            for (const revokerData of input.Revokers) {
                (0, chai_1.expect)(await newAuthorizer.isRevoker(revokerData.role, revokerData.grantee, revokerData.target)).to.be.true;
            }
        });
        it('sets up delays properly', async () => {
            await (0, time_1.advanceTime)(5 * time_1.DAY);
            await migrator.executeDelays();
            for (const delayData of input.ExecuteDelays) {
                (0, chai_1.expect)(await newAuthorizer.getActionIdDelay(delayData.actionId)).to.be.eq(delayData.newDelay);
            }
            for (const delayData of input.GrantDelays) {
                (0, chai_1.expect)(await newAuthorizer.getActionIdGrantDelay(delayData.actionId)).to.be.eq(delayData.newDelay);
            }
        });
        it('does not set the new authorizer immediately', async () => {
            (0, chai_1.expect)(await newAuthorizer.isRoot(migrator.address)).to.be.true;
            (0, chai_1.expect)(await vault.getAuthorizer()).to.be.equal(oldAuthorizer.address);
        });
        it('finalizes the migration once new root address claims root status', async () => {
            await (0, chai_1.expect)(migrator.finalizeMigration()).to.be.revertedWith('ROOT_NOT_CLAIMED_YET');
            await newAuthorizer.connect(root).claimRoot();
            await migrator.finalizeMigration();
            (0, chai_1.expect)(await vault.getAuthorizer()).to.be.equal(newAuthorizer.address);
            (0, chai_1.expect)(await newAuthorizer.isRoot(root.address)).to.be.true;
            (0, chai_1.expect)(await newAuthorizer.isRoot(migrator.address)).to.be.false;
        });
        // we mint only on mainnet
        if (network == 'mainnet') {
            it('allows minting after the migration', async () => {
                const balancerMinterTask = new _src_2.Task('20220325-gauge-controller', _src_2.TaskMode.READ_ONLY, (0, _src_4.getForkedNetwork)(hardhat_1.default));
                const balancerMinter = await balancerMinterTask.deployedInstance('BalancerMinter');
                const balancerTokenAdminTask = new _src_2.Task('20220325-balancer-token-admin', _src_2.TaskMode.READ_ONLY, (0, _src_4.getForkedNetwork)(hardhat_1.default));
                const balancerTokenAdmin = await balancerTokenAdminTask.deployedInstance('BalancerTokenAdmin');
                const tokensTask = new _src_2.Task('00000000-tokens', _src_2.TaskMode.READ_ONLY, (0, _src_4.getForkedNetwork)(hardhat_1.default));
                const balAddress = tokensTask.output().BAL;
                const balancerToken = await balancerTokenAdminTask.instanceAt('IERC20', balAddress);
                const balancerMinterSigner = await (0, _src_3.impersonate)(balancerMinter.address, (0, numbers_1.fp)(100));
                const tx = await balancerTokenAdmin.connect(balancerMinterSigner).mint(balancerMinter.address, 100);
                expectEvent.inIndirectReceipt(await tx.wait(), balancerToken.interface, 'Transfer', {
                    from: constants_1.ZERO_ADDRESS,
                    to: balancerMinter.address,
                    value: 100,
                });
            });
        }
        it('allows migrating the authorizer address again', async () => {
            const setAuthorizerActionId = await (0, actions_1.actionId)(vault, 'setAuthorizer');
            (0, chai_1.expect)(await vault.getAuthorizer()).to.be.eq(newAuthorizer.address);
            await newAuthorizer.connect(root).grantPermission(setAuthorizerActionId, root.address, vault.address);
            // Schedule authorizer change
            const nextAuthorizer = '0xaF52695E1bB01A16D33D7194C28C42b10e0Dbec2';
            const tx = await newAuthorizer
                .connect(root)
                .schedule(vault.address, vault.interface.encodeFunctionData('setAuthorizer', [nextAuthorizer]), [root.address]);
            const event = expectEvent.inReceipt(await tx.wait(), 'ExecutionScheduled');
            await (0, time_1.advanceTime)(30 * time_1.DAY);
            // Execute authorizer change
            await newAuthorizer.connect(root).execute(event.args.scheduledExecutionId);
            (0, chai_1.expect)(await vault.getAuthorizer()).to.be.eq(nextAuthorizer);
        });
    });
}
for (const network of input_1.default.networks) {
    doForkTestsOnNetwork(network, input_1.default[network].TRANSITION_END_BLOCK);
}
