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
const numbers_1 = require("@helpers/numbers");
const actions_1 = require("@helpers/models/misc/actions");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const _src_1 = require("@src");
const _src_2 = require("@src");
const _src_3 = require("@src");
const _src_4 = require("@src");
const _src_5 = require("@src");
const time_1 = require("@helpers/time");
const expectTransfer_1 = require("@helpers/expectTransfer");
const constants_1 = require("@helpers/constants");
(0, _src_1.describeForkTest)('ChildChainGaugeFactoryV2', 'arbitrum', 72486400, function () {
    let vault, authorizer, authorizerAdaptor;
    let gaugeFactory, pseudoMinter, veProxy, gauge;
    let admin, user1, user2, govMultisig;
    let whale;
    let gateway;
    let BPT, BAL, USDT;
    let task;
    const GOV_MULTISIG = '0xaf23dc5983230e9eeaf93280e312e57539d098d0';
    const RDNT_WETH_POOL = '0x32dF62dc3aEd2cD6224193052Ce665DC18165841';
    const BPT_HOLDER_1 = '0x1967654222ec22e37c0b0c2a15583b9581d3095e';
    const BPT_HOLDER_2 = '0x708e5804d0e930fac266d8b3f3e13edba35ac86e';
    const BAL_L2_GATEWAY = '0x09e9222e96e7b4ae2a407b98d48e330053351eee';
    const USDT_ADDRESS = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';
    const USDT_WHALE = '0xf89d7b9c864f589bbf53a82105107622b35eaa40';
    async function stakeBPT(user1Stake, user2Stake) {
        await BPT.connect(user1).approve(gauge.address, user1Stake);
        await BPT.connect(user2).approve(gauge.address, user2Stake);
        await gauge.connect(user1)['deposit(uint256)'](user1Stake);
        await gauge.connect(user2)['deposit(uint256)'](user2Stake);
    }
    async function bridgeBAL(to, amount) {
        const bridgeInterface = ['function bridgeMint(address account, uint256 amount) external'];
        const BAL = await hardhat_1.ethers.getContractAt(bridgeInterface, await pseudoMinter.getBalancerToken());
        await BAL.connect(gateway).bridgeMint(to, amount);
    }
    async function checkpointAndAdvanceWeek() {
        await gauge.connect(user1).user_checkpoint(user1.address);
        await gauge.connect(user2).user_checkpoint(user2.address);
        await (0, time_1.advanceToTimestamp)((await (0, time_1.currentWeekTimestamp)()).add(time_1.WEEK));
    }
    before('run task', async () => {
        task = new _src_2.Task('20230316-child-chain-gauge-factory-v2', _src_2.TaskMode.TEST, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        gaugeFactory = await task.deployedInstance('ChildChainGaugeFactory');
    });
    before('setup accounts', async () => {
        [, admin] = await hardhat_1.ethers.getSigners();
        user1 = await (0, _src_4.impersonate)(BPT_HOLDER_1, (0, numbers_1.fp)(100));
        user2 = await (0, _src_4.impersonate)(BPT_HOLDER_2, (0, numbers_1.fp)(100));
        govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        whale = await (0, _src_4.impersonate)(USDT_WHALE, (0, numbers_1.fp)(1000));
        // The gateway is actually a contract, but we impersonate it to be able to call `mint` on the BAL token, simulating
        // a token bridge.
        gateway = await (0, _src_4.impersonate)(BAL_L2_GATEWAY, (0, numbers_1.fp)(100));
    });
    before('setup contracts', async () => {
        const vaultTask = new _src_2.Task('20210418-vault', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        vault = await vaultTask.deployedInstance('Vault');
        authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
        const authorizerAdaptorTask = new _src_2.Task('20220325-authorizer-adaptor', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');
        const pseudoMinterTask = new _src_2.Task('20230316-l2-balancer-pseudo-minter', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        pseudoMinter = await pseudoMinterTask.deployedInstance('L2BalancerPseudoMinter');
        const veProxyTask = new _src_2.Task('20230316-l2-ve-delegation-proxy', _src_2.TaskMode.READ_ONLY, (0, _src_3.getForkedNetwork)(hardhat_1.default));
        veProxy = await veProxyTask.deployedInstance('VotingEscrowDelegationProxy');
    });
    before('setup tokens', async () => {
        BPT = await task.instanceAt('IERC20', RDNT_WETH_POOL);
        USDT = await task.instanceAt('IERC20', USDT_ADDRESS);
        BAL = await task.instanceAt('IERC20', await pseudoMinter.getBalancerToken());
    });
    before('grant add / remove child chain gauge factory permissions to admin', async () => {
        const govMultisig = await (0, _src_4.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(100));
        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(pseudoMinter, 'addGaugeFactory'), admin.address);
        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(pseudoMinter, 'removeGaugeFactory'), admin.address);
    });
    describe('create', () => {
        it('returns factory version', async () => {
            const expectedFactoryVersion = {
                name: 'ChildChainGaugeFactory',
                version: 2,
                deployment: '20230316-child-chain-gauge-factory-v2',
            };
            (0, chai_1.expect)(await gaugeFactory.version()).to.equal(JSON.stringify(expectedFactoryVersion));
        });
        it('adds gauge factory to pseudo minter', async () => {
            await pseudoMinter.connect(admin).addGaugeFactory(gaugeFactory.address);
            (0, chai_1.expect)(await pseudoMinter.isValidGaugeFactory(gaugeFactory.address)).to.be.true;
        });
        it('create gauge', async () => {
            const tx = await gaugeFactory.create(BPT.address);
            const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
            gauge = await task.instanceAt('ChildChainGauge', event.args.gauge);
            (0, chai_1.expect)(await gaugeFactory.isGaugeFromFactory(gauge.address)).to.be.true;
        });
    });
    describe('getters', () => {
        it('returns BPT', async () => {
            (0, chai_1.expect)(await gauge.lp_token()).to.equal(BPT.address);
        });
        it('returns factory', async () => {
            (0, chai_1.expect)(await gauge.factory()).to.equal(gaugeFactory.address);
        });
        it('returns gauge version', async () => {
            const expectedGaugeVersion = {
                name: 'ChildChainGauge',
                version: 2,
                deployment: '20230316-child-chain-gauge-factory-v2',
            };
            (0, chai_1.expect)(await gauge.version()).to.equal(JSON.stringify(expectedGaugeVersion));
        });
        it('returns the pseudo minter', async () => {
            (0, chai_1.expect)(await gauge.bal_pseudo_minter()).to.be.eq(pseudoMinter.address);
        });
    });
    describe('BAL rewards', () => {
        const balPerWeek = (0, numbers_1.fp)(2000);
        const bptAmount = (0, numbers_1.fp)(100);
        function itMintsRewardsForUsers(rewardUser1, rewardUser2) {
            describe('reward distribution', () => {
                before(async () => {
                    await checkpointAndAdvanceWeek();
                });
                it('outputs the claimable tokens', async () => {
                    const availableTokens1 = await gauge.callStatic.claimable_tokens(user1.address);
                    const availableTokens2 = await gauge.callStatic.claimable_tokens(user2.address);
                    (0, chai_1.expect)(availableTokens1).to.be.almostEqual(rewardUser1);
                    (0, chai_1.expect)(availableTokens2).to.be.almostEqual(rewardUser2);
                });
                it('"mints" BAL rewards for users', async () => {
                    const receipt1 = await (await pseudoMinter.connect(user1).mint(gauge.address)).wait();
                    const receipt2 = await (await pseudoMinter.connect(user2).mint(gauge.address)).wait();
                    const user1Rewards = (0, expectTransfer_1.expectTransferEvent)(receipt1, { from: pseudoMinter.address, to: user1.address }, BAL.address);
                    (0, chai_1.expect)(user1Rewards.args.value).to.be.almostEqual(rewardUser1);
                    const user2Rewards = (0, expectTransfer_1.expectTransferEvent)(receipt2, { from: pseudoMinter.address, to: user2.address }, BAL.address);
                    (0, chai_1.expect)(user2Rewards.args.value).to.be.almostEqual(rewardUser2);
                });
                it('updates claimable tokens', async () => {
                    (0, chai_1.expect)(await gauge.callStatic.claimable_tokens(user1.address)).to.be.eq(0);
                    (0, chai_1.expect)(await gauge.callStatic.claimable_tokens(user2.address)).to.be.eq(0);
                });
            });
        }
        context('without boosts', () => {
            before('stake BPT to the gauges and bridge BAL rewards', async () => {
                await stakeBPT(bptAmount, bptAmount.mul(2));
                await bridgeBAL(gauge.address, balPerWeek);
                (0, chai_1.expect)(await BAL.balanceOf(gauge.address)).to.be.eq(balPerWeek);
                (0, chai_1.expect)(await BAL.balanceOf(pseudoMinter.address)).to.be.eq(0);
            });
            it('checkpoints the gauge and moves the rewards to the pseudo minter', async () => {
                await gauge.user_checkpoint(user1.address);
                await gauge.user_checkpoint(user2.address);
                (0, chai_1.expect)(await BAL.balanceOf(gauge.address)).to.be.eq(0);
                (0, chai_1.expect)(await BAL.balanceOf(pseudoMinter.address)).to.be.eq(balPerWeek);
            });
            // User 2 has double the stake, so 1/3 of the rewards go to User 1, and 2/3 go to User 2.
            itMintsRewardsForUsers(balPerWeek.div(3), balPerWeek.mul(2).div(3));
            context('with extra rewards', () => {
                const extraReward = balPerWeek.mul(20);
                before('stake BPT to the gauges and bridge BAL rewards', async () => {
                    await bridgeBAL(gauge.address, extraReward);
                });
                // User 2 has double the stake, so 1/3 of the rewards go to User 1, and 2/3 go to User 2.
                // The increased rewards are still distributed proportionally.
                itMintsRewardsForUsers(extraReward.div(3), extraReward.mul(2).div(3));
            });
        });
        context('with boosts', () => {
            let mockVE, veBoost;
            const boost = (0, numbers_1.fp)(100);
            // MockVE balances represent veBAL balances bridged to the L2.
            async function setupBoosts(user1Boost, user2Boost) {
                await mockVE.mint(user1.address, user1Boost);
                await mockVE.mint(user2.address, user2Boost);
            }
            before('update VE implementation in the proxy', async () => {
                await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(veProxy, 'setDelegation'), admin.address);
                // In practice, the contract that provides veBAL balances is a third party contract (e.g. Layer Zero).
                mockVE = await (0, _src_5.deploy)('MockVE');
                veBoost = await (0, _src_5.deploy)('VeBoostV2', [constants_1.ZERO_ADDRESS, mockVE.address]);
                await bridgeBAL(gauge.address, balPerWeek);
                await setupBoosts(boost.mul(2), boost);
            });
            it('sets delegation', async () => {
                const tx = await veProxy.connect(admin).setDelegation(veBoost.address);
                expectEvent.inReceipt(await tx.wait(), 'DelegationImplementationUpdated', {
                    newImplementation: veBoost.address,
                });
            });
            context('without delegations', () => {
                before('status checks', async () => {
                    const user1Stake = await gauge.balanceOf(user1.address);
                    const user2Stake = await gauge.balanceOf(user2.address);
                    const user1Boost = await veProxy.adjustedBalanceOf(user1.address);
                    const user2Boost = await veProxy.adjustedBalanceOf(user2.address);
                    // User 1 has half the stake and twice the boost as user 1.
                    (0, chai_1.expect)(user1Stake).to.be.eq(bptAmount);
                    (0, chai_1.expect)(user2Stake).to.be.eq(user1Stake.mul(2));
                    (0, chai_1.expect)(user1Boost).to.be.eq(boost.mul(2));
                    (0, chai_1.expect)(user2Boost).to.be.eq(user1Boost.div(2));
                    // Base boost and stake are equal in nominal terms.
                    (0, chai_1.expect)(boost).to.be.eq(bptAmount);
                });
                // See unit test for reference: 'two users, unequal BPT stake and unequal boost'.
                itMintsRewardsForUsers(balPerWeek.mul(5).div(12), balPerWeek.mul(7).div(12));
            });
            context('with delegations', () => {
                const boostFn = 'boost(address,uint256,uint256)';
                before('delegate boosts', async () => {
                    await bridgeBAL(gauge.address, balPerWeek);
                    await mockVE.setLockedEnd(user1.address, constants_1.MAX_UINT256);
                    await mockVE.setLockedEnd(user2.address, constants_1.MAX_UINT256);
                    const endTime = (await (0, time_1.currentWeekTimestamp)()).add(time_1.WEEK);
                    await veBoost.connect(user1)[boostFn](user2.address, boost, endTime);
                });
                before('status checks', async () => {
                    const user1Stake = await gauge.balanceOf(user1.address);
                    const user2Stake = await gauge.balanceOf(user2.address);
                    const user1Boost = await veProxy.adjustedBalanceOf(user1.address);
                    const user2Boost = await veProxy.adjustedBalanceOf(user2.address);
                    // User 2 has twice the stake and twice the boost as user 1.
                    (0, chai_1.expect)(user1Stake).to.be.eq(bptAmount);
                    (0, chai_1.expect)(user2Stake).to.be.eq(user1Stake.mul(2));
                    (0, chai_1.expect)(user1Boost).to.be.almostEqual(boost); // Using almostEqual because of VeBoostV2 inner accounting.
                    (0, chai_1.expect)(user2Boost).to.be.almostEqual(user1Boost.mul(2));
                    // Base boost and stake are equal in nominal terms.
                    (0, chai_1.expect)(boost).to.be.eq(bptAmount);
                });
                // See unit test for reference: 'two users, unequal BPT stake and unequal boost'.
                itMintsRewardsForUsers(balPerWeek.div(3), balPerWeek.mul(2).div(3));
                context('after delegation expires', () => {
                    before('bridge BAL and check status', async () => {
                        await bridgeBAL(gauge.address, balPerWeek);
                        const user1Boost = await veProxy.adjustedBalanceOf(user1.address);
                        const user2Boost = await veProxy.adjustedBalanceOf(user2.address);
                        // One week has passed after the last test, which means the delegation has ended.
                        // Therefore, we go back to the original case without delegations.
                        (0, chai_1.expect)(user1Boost).to.be.eq(boost.mul(2));
                        (0, chai_1.expect)(user2Boost).to.be.eq(user1Boost.div(2));
                        // Base boost and stake are equal in nominal terms.
                        (0, chai_1.expect)(boost).to.be.eq(bptAmount);
                    });
                    // Same case as 'without delegations' again.
                    itMintsRewardsForUsers(balPerWeek.mul(5).div(12), balPerWeek.mul(7).div(12));
                });
                context('when veBAL lock expired before delegating boost', () => {
                    before(async () => {
                        await mockVE.setLockedEnd(user1.address, (await (0, time_1.currentTimestamp)()).sub(1));
                    });
                    it('reverts', async () => {
                        const endTime = (await (0, time_1.currentWeekTimestamp)()).add(time_1.WEEK);
                        await (0, chai_1.expect)(veBoost.connect(user1)[boostFn](user2.address, boost, endTime)).to.be.reverted;
                    });
                });
                context('after killing delegation implementation', () => {
                    before(async () => {
                        await authorizer.connect(govMultisig).grantRole(await (0, actions_1.actionId)(veProxy, 'killDelegation'), admin.address);
                        await veProxy.connect(admin).killDelegation();
                        await bridgeBAL(gauge.address, balPerWeek);
                    });
                    // Same case as 'without boosts' again.
                    itMintsRewardsForUsers(balPerWeek.div(3), balPerWeek.mul(2).div(3));
                });
            });
        });
    });
    describe('other rewards', () => {
        const rewardAmount = (0, numbers_1.fp)(1e6).div((0, numbers_1.bn)(1e12)); // Scaling factor is 1e12 since USDT has 6 decimals.
        let reward;
        let distributor;
        let claimer, other;
        function itTransfersRewardsToClaimer() {
            let expectedReward;
            let receipt;
            let claimedBeforeOther;
            let claimableBeforeOther;
            before('estimate expected reward', async () => {
                // Claimer rewards are proportional to their BPT stake in the gauge given that staking time is constant for all
                // users.
                const claimerStake = await gauge.balanceOf(claimer.address);
                const gaugeTotalSupply = await gauge.totalSupply();
                expectedReward = rewardAmount.mul(claimerStake).div(gaugeTotalSupply);
                claimedBeforeOther = await gauge.claimed_reward(other.address, reward.address);
                claimableBeforeOther = await gauge.claimable_reward(other.address, reward.address);
                receipt = await (await gauge.connect(claimer)['claim_rewards(address,address)'](claimer.address, constants_1.ZERO_ADDRESS)).wait();
            });
            it('transfers rewards to claimer', async () => {
                const event = (0, expectTransfer_1.expectTransferEvent)(receipt, { from: gauge.address, to: claimer.address }, reward.address);
                (0, chai_1.expect)(event.args.value).to.be.almostEqual(expectedReward);
            });
            it('updates claimed balance for claimer', async () => {
                const claimedAfterClaimer = await gauge.claimed_reward(claimer.address, reward.address);
                (0, chai_1.expect)(claimedAfterClaimer).to.be.almostEqual(expectedReward);
            });
            it('keeps the same claimed balances for others', async () => {
                const claimedAfterOther = await gauge.claimed_reward(other.address, reward.address);
                (0, chai_1.expect)(claimedAfterOther).to.be.eq(claimedBeforeOther);
            });
            it('updates claimable balance for claimer', async () => {
                const claimableAfterClaimer = await gauge.claimable_reward(claimer.address, reward.address);
                (0, chai_1.expect)(claimableAfterClaimer).to.be.eq(0);
            });
            it('keeps the same claimable balances for others', async () => {
                const claimableAfterOther = await gauge.claimable_reward(other.address, reward.address);
                (0, chai_1.expect)(claimableAfterOther).to.be.deep.eq(claimableBeforeOther);
            });
        }
        before(async () => {
            reward = USDT;
            distributor = whale;
            claimer = user1;
            other = user2;
            await authorizer
                .connect(govMultisig)
                .grantRole(await (0, actions_1.actionId)(authorizerAdaptor, 'add_reward', gauge.interface), admin.address);
            authorizerAdaptor
                .connect(admin)
                .performAction(gauge.address, gauge.interface.encodeFunctionData('add_reward', [reward.address, distributor.address]));
            await reward.connect(distributor).approve(gauge.address, rewardAmount);
            await gauge.connect(distributor).deposit_reward_token(reward.address, rewardAmount);
            await (0, time_1.advanceToTimestamp)((await (0, time_1.currentTimestamp)()).add(time_1.WEEK));
        });
        itTransfersRewardsToClaimer();
    });
});
