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
const time_1 = require("@helpers/time");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const expectTransfer_1 = require("@helpers/expectTransfer");
const utils_1 = require("ethers/lib/utils");
const _src_1 = require("@src");
(0, _src_1.describeForkTest)('FeeDistributor', 'mainnet', 15130000, function () {
    let veBALHolder, veBALHolder2, feeCollector, voterProxyAdmin;
    let distributor;
    let VEBAL, BAL, WETH, voterProxy;
    let task;
    const VEBAL_HOLDER = '0xA2e7002E0FFC42e4228292D67C13a81FDd191870';
    const VEBAL_HOLDER_2 = '0x49a2dcc237a65cc1f412ed47e0594602f6141936';
    const PROTOCOL_FEE_COLLECTOR = '0xce88686553686da562ce7cea497ce749da109f9f';
    const VOTER_PROXY_ADMIN = '0x7818a1da7bd1e64c199029e86ba244a9798eee10';
    const BAL_ADDRESS = '0xba100000625a3754423978a60c9317c58a424e3D';
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const VOTER_PROXY_ADDRESS = '0xaf52695e1bb01a16d33d7194c28c42b10e0dbec2';
    const balAmount = (0, numbers_1.fp)(42);
    const wethAmount = (0, numbers_1.fp)(5);
    let firstWeek;
    before('run task', async () => {
        task = new _src_1.Task('20220714-fee-distributor-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await (0, time_1.advanceToTimestamp)(1657756800 + time_1.HOUR);
        await task.run({ force: true });
        distributor = await task.instanceAt('FeeDistributor', task.output({ network: 'test' }).FeeDistributor);
    });
    before('setup accounts', async () => {
        veBALHolder = await (0, _src_1.impersonate)(VEBAL_HOLDER);
        veBALHolder2 = await (0, _src_1.impersonate)(VEBAL_HOLDER_2);
        feeCollector = await (0, _src_1.impersonate)(PROTOCOL_FEE_COLLECTOR);
        voterProxyAdmin = await (0, _src_1.impersonate)(VOTER_PROXY_ADMIN);
    });
    before('setup contracts', async () => {
        const veBALTask = new _src_1.Task('20220325-gauge-controller', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        VEBAL = await veBALTask.instanceAt('VotingEscrow', await veBALTask.output({ network: 'mainnet' }).VotingEscrow);
        // We reuse this task as it contains an ABI similar to the one in real ERC20 tokens
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        BAL = await testBALTokenTask.instanceAt('TestBalancerToken', BAL_ADDRESS);
        WETH = await testBALTokenTask.instanceAt('TestBalancerToken', WETH_ADDRESS);
    });
    // These tests are the same as in the 20220420-fee-distributor task.
    describe('claims', () => {
        context('in the first week', () => {
            before(async () => {
                firstWeek = (0, numbers_1.bn)(task.input().startTime);
                await (0, time_1.advanceToTimestamp)(firstWeek.add(time_1.DAY));
            });
            context('with BAL distributed', () => {
                before('send BAL to distribute', async () => {
                    await BAL.connect(feeCollector).approve(distributor.address, balAmount);
                    await distributor.connect(feeCollector).depositToken(BAL.address, balAmount);
                });
                it('veBAL holders cannot yet claim tokens', async () => {
                    const balancesBefore = await Promise.all([BAL, WETH].map((token) => token.balanceOf(veBALHolder.address)));
                    const tx = await distributor.claimTokens(veBALHolder.address, [BAL.address, WETH.address]);
                    const balancesAfter = await Promise.all([BAL, WETH].map((token) => token.balanceOf(veBALHolder.address)));
                    expectEvent.notEmitted(await tx.wait(), 'TokensClaimed');
                    (0, chai_1.expect)(balancesAfter).to.deep.equal(balancesBefore);
                });
            });
        });
        context('in the second week', () => {
            before('advance time', async () => {
                // 1 day into the second week
                await (0, time_1.advanceToTimestamp)(firstWeek.add(time_1.WEEK).add(time_1.DAY));
            });
            context('with WETH distributed', () => {
                before('send BAL to distribute', async () => {
                    await BAL.connect(feeCollector).approve(distributor.address, balAmount.mul(3));
                    await distributor.connect(feeCollector).depositToken(BAL.address, balAmount.mul(3));
                });
                before('send WETH to distribute', async () => {
                    await WETH.connect(feeCollector).approve(distributor.address, wethAmount);
                    await distributor.connect(feeCollector).depositToken(WETH.address, wethAmount);
                });
                it('veBAL holders can claim BAL and not WETH', async () => {
                    const holderFirstWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder.address, firstWeek);
                    const firstWeekSupply = await VEBAL['totalSupply(uint256)'](firstWeek);
                    const expectedBALAmount = balAmount.mul(holderFirstWeekBalance).div(firstWeekSupply);
                    const wethBalanceBefore = await WETH.balanceOf(veBALHolder.address);
                    const tx = await distributor.claimTokens(veBALHolder.address, [BAL.address, WETH.address]);
                    const wethBalanceAfter = await WETH.balanceOf(veBALHolder.address);
                    (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: distributor.address, to: veBALHolder.address, value: expectedBALAmount }, BAL.address);
                    (0, chai_1.expect)(wethBalanceAfter).to.equal(wethBalanceBefore);
                });
            });
        });
        context('in the third week', () => {
            before('advance time', async () => {
                // 1 day into the third week
                await (0, time_1.advanceToTimestamp)(firstWeek.add(2 * time_1.WEEK).add(time_1.DAY));
            });
            it('veBAL holders can claim BAL and WETH', async () => {
                const secondWeek = firstWeek.add(time_1.WEEK);
                const holderSecondWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder.address, secondWeek);
                const secondWeekSupply = await VEBAL['totalSupply(uint256)'](secondWeek);
                const expectedBALAmount = balAmount.mul(3).mul(holderSecondWeekBalance).div(secondWeekSupply);
                const expectedWETHAmount = wethAmount.mul(holderSecondWeekBalance).div(secondWeekSupply);
                const tx = await distributor.claimTokens(veBALHolder.address, [BAL.address, WETH.address]);
                (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: distributor.address, to: veBALHolder.address, value: expectedBALAmount }, BAL.address);
                (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: distributor.address, to: veBALHolder.address, value: expectedWETHAmount }, WETH.address);
            });
            it('veBAL holders can claim all the BAL and WETH at once', async () => {
                const holderFirstWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder2.address, firstWeek);
                const firstWeekSupply = await VEBAL['totalSupply(uint256)'](firstWeek);
                const balFirstWeekAmount = balAmount.mul(holderFirstWeekBalance).div(firstWeekSupply);
                const secondWeek = firstWeek.add(time_1.WEEK);
                const holderSecondWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder2.address, secondWeek);
                const secondWeekSupply = await VEBAL['totalSupply(uint256)'](secondWeek);
                const balSecondWeekAmount = balAmount.mul(3).mul(holderSecondWeekBalance).div(secondWeekSupply);
                const expectedBALAmount = balFirstWeekAmount.add(balSecondWeekAmount);
                const expectedWETHAmount = wethAmount.mul(holderSecondWeekBalance).div(secondWeekSupply);
                const tx = await distributor.claimTokens(veBALHolder2.address, [BAL.address, WETH.address]);
                (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: distributor.address, to: veBALHolder2.address, value: expectedBALAmount }, BAL.address);
                (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: distributor.address, to: veBALHolder2.address, value: expectedWETHAmount }, WETH.address);
            });
        });
    });
    describe('only caller check', () => {
        before('setup voter proxy', async () => {
            const voterProxyABI = new hardhat_1.ethers.utils.Interface([
                'function isValidSignature(bytes32 _hash, bytes) view returns (bytes4)',
                'function setVote(bytes32 _hash, bool _valid)',
                'function claimFees(address _distroContract, address _token) returns (uint256)',
            ]).format();
            voterProxy = await hardhat_1.ethers.getContractAt(voterProxyABI, VOTER_PROXY_ADDRESS);
            // VoterProxy contract doesn't actually use the signature; only voting with the right hash matters.
            // This hash is the distributor's outcome when enabling the caller check form the VoterProxy with the first
            // available nonce.
            const domain = {
                name: 'FeeDistributor',
                version: '1',
                chainId: (await distributor.provider.getNetwork()).chainId,
                verifyingContract: distributor.address,
            };
            const types = {
                SetOnlyCallerCheck: [
                    { name: 'user', type: 'address' },
                    { name: 'enabled', type: 'bool' },
                    { name: 'nonce', type: 'uint256' },
                ],
            };
            const values = {
                user: voterProxy.address,
                enabled: true,
                nonce: (await distributor.getNextNonce(voterProxy.address)).toString(),
            };
            await voterProxy.connect(voterProxyAdmin).setVote(utils_1._TypedDataEncoder.hash(domain, types, values), true);
            await distributor.connect(voterProxyAdmin).setOnlyCallerCheckWithSignature(voterProxy.address, true, '0x');
        });
        context('in the third week, when every token is claimable', () => {
            before(async () => {
                firstWeek = await (0, time_1.currentWeekTimestamp)();
                await (0, time_1.advanceToTimestamp)(firstWeek.add(2 * time_1.WEEK).add(time_1.DAY));
            });
            it('other account cannot claim for voter proxy', async () => {
                await (0, chai_1.expect)(distributor.claimTokens(voterProxy.address, [BAL.address, WETH.address])).to.be.revertedWith('BAL#401');
            });
            it('voter proxy can claim fees', async () => {
                await (0, chai_1.expect)(voterProxy.connect(voterProxyAdmin).claimFees(distributor.address, BAL.address)).to.not.be
                    .reverted;
                await (0, chai_1.expect)(voterProxy.connect(voterProxyAdmin).claimFees(distributor.address, WETH.address)).to.not.be
                    .reverted;
            });
        });
    });
});
