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
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importStar(require("hardhat"));
const chai_1 = require("chai");
const _src_1 = require("@src");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const sharedBeforeEach_1 = require("@helpers/sharedBeforeEach");
function doForkTestsOnNetwork(network, block) {
    (0, _src_1.describeForkTest)(`BatchRelayerLibrary V6 - Gauge checkpoints - ${network}`, network, block, function () {
        let task;
        let relayer, library;
        let sender;
        let vault, authorizer;
        let childChainGaugeFactory;
        let gaugeAddressA, gaugeAddressB;
        before('run task', async () => {
            task = new _src_1.Task('20231031-batch-relayer-v6', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            await task.run({ force: true });
            library = await task.deployedInstance('BatchRelayerLibrary');
            relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
        });
        before('load vault and tokens', async () => {
            const vaultTask = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            vault = await vaultTask.instanceAt('Vault', await library.getVault());
            const authorizerTask = new _src_1.Task('20210418-authorizer', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            authorizer = await authorizerTask.deployedInstance('Authorizer');
            const childChainGaugeFactoryTask = new _src_1.Task('20230316-child-chain-gauge-factory-v2', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
            childChainGaugeFactory = await childChainGaugeFactoryTask.deployedInstance('ChildChainGaugeFactory');
        });
        before('deploy auxiliary contracts (tokens and gauges)', async () => {
            const tokenA = await (0, _src_1.deploy)('TestToken', ['Token A', 'TSTA', 18]);
            const tokenB = await (0, _src_1.deploy)('TestToken', ['Token B', 'TSTB', 18]);
            const txA = await childChainGaugeFactory.create(tokenA.address);
            gaugeAddressA = expectEvent.inReceipt(await txA.wait(), 'GaugeCreated').args.gauge;
            const txB = await childChainGaugeFactory.create(tokenB.address);
            gaugeAddressB = expectEvent.inReceipt(await txB.wait(), 'GaugeCreated').args.gauge;
            (0, chai_1.expect)(gaugeAddressA).to.not.be.eq(gaugeAddressB);
        });
        before('load signers', async () => {
            [, sender] = await hardhat_1.ethers.getSigners();
        });
        before('approve relayer at the authorizer', async () => {
            const relayerActionIds = await Promise.all(['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) => vault.getActionId(vault.interface.getSighash(action))));
            // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
            // such an account exists.
            const admin = await (0, _src_1.impersonate)(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));
            // Grant relayer permission to call all relayer functions
            await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
        });
        (0, sharedBeforeEach_1.sharedBeforeEach)('approve relayer by the user', async () => {
            await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
        });
        it('can call user checkpoint: true', async () => {
            (0, chai_1.expect)(await library.canCallUserCheckpoint()).to.be.true;
        });
        it('sender can update their gauge liquidity limits', async () => {
            const tx = await relayer
                .connect(sender)
                .multicall([
                library.interface.encodeFunctionData('gaugeCheckpoint', [sender.address, [gaugeAddressA, gaugeAddressB]]),
            ]);
            const gaugeInterface = new hardhat_1.ethers.utils.Interface([
                'event UpdateLiquidityLimit(address indexed user, uint256 original_balance, uint256 original_supply, uint256 working_balance, uint256 working_supply)',
            ]);
            expectEvent.inIndirectReceipt(await tx.wait(), gaugeInterface, 'UpdateLiquidityLimit', { user: sender.address }, gaugeAddressA);
            expectEvent.inIndirectReceipt(await tx.wait(), gaugeInterface, 'UpdateLiquidityLimit', { user: sender.address }, gaugeAddressB);
        });
    });
}
const networksUnderTest = {
    polygon: 49698000,
    arbitrum: 148441000,
    optimism: 111935000,
    gnosis: 30856000,
    avalanche: 37505000,
    zkevm: 7228000,
    base: 6339000,
};
Object.entries(networksUnderTest).forEach(([network, block]) => doForkTestsOnNetwork(network, block));
