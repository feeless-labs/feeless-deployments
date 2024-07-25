"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const hardhat_1 = __importDefault(require("hardhat"));
const hardhat_2 = require("hardhat");
const chai_1 = require("chai");
const numbers_1 = require("@helpers/numbers");
const expectTransfer_1 = require("@helpers/expectTransfer");
const _src_1 = require("@src");
const merkleTree_1 = require("./merkleTree");
(0, _src_1.describeForkTest)('MerkleOrchard V2', 'mainnet', 16684000, function () {
    let distributor;
    let merkleOrchard;
    let ldoToken;
    let task;
    const LDO_ADDRESS = '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32';
    // Root taken from https://github.com/balancer-labs/bal-mining-scripts/blob/incident-response/reports/_incident-response/_roots-lido.json.
    const LDO_ROOT = '0x748ae6b1a5704a0711f56bd6b109627ab0d39ae6c0eee11d85450fba7979c8ec';
    const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
    const elements = [];
    const pendingClaims = [];
    let merkleTree;
    let distributorLdoBalance;
    before('run task', async () => {
        task = new _src_1.Task('20230222-merkle-orchard-v2', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        merkleOrchard = await task.deployedInstance('MerkleOrchard');
    });
    before('setup accounts', async () => {
        [, distributor] = await hardhat_2.ethers.getSigners();
        distributor = await (0, _src_1.impersonate)(GOV_MULTISIG, (0, numbers_1.fp)(10));
    });
    before('setup contracts', async () => {
        // We use test balancer token to make use of the ERC-20 interface.
        const testBALTokenTask = new _src_1.Task('20220325-test-balancer-token', _src_1.TaskMode.READ_ONLY, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        ldoToken = await testBALTokenTask.instanceAt('TestBalancerToken', LDO_ADDRESS);
    });
    before('compute merkle tree', async () => {
        // Data taken from https://github.com/balancer-labs/bal-mining-scripts/blob/incident-response/reports/_incident-response/1/__ethereum_0x5a98fcbea516cf06857215779fd812ca3bef1b32.json.
        const filePath = path_1.default.join(task.dir(), 'test/data/ldo-claims.json');
        const ldoClaims = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
        let totalClaimableAmount = (0, numbers_1.bn)(0);
        Object.entries(ldoClaims).forEach(([address, amount]) => {
            const amountFp = (0, numbers_1.fp)(Number(amount));
            totalClaimableAmount = totalClaimableAmount.add(amountFp);
            pendingClaims.push({ address, amount: amountFp });
            elements.push(encodeElement(address, amountFp));
        });
        merkleTree = new merkleTree_1.MerkleTree(elements);
        const root = merkleTree.getHexRoot();
        await (0, chai_1.expect)(root).to.be.eq(LDO_ROOT);
        // Distributor LDO balance is slightly less than total balance calculated from pending claims.
        distributorLdoBalance = await ldoToken.balanceOf(distributor.address);
        (0, chai_1.expect)(distributorLdoBalance).to.be.equalWithError(totalClaimableAmount);
    });
    it('stores an allocation', async () => {
        await ldoToken.connect(distributor).approve(merkleOrchard.address, distributorLdoBalance);
        await merkleOrchard.connect(distributor).createDistribution(LDO_ADDRESS, LDO_ROOT, distributorLdoBalance, (0, numbers_1.bn)(1));
        const proof = merkleTree.getHexProof(elements[0]);
        const result = await merkleOrchard.verifyClaim(LDO_ADDRESS, distributor.address, 1, pendingClaims[0].address, pendingClaims[0].amount, proof);
        (0, chai_1.expect)(result).to.equal(true);
    });
    it('allows the user to claim a single distribution', async () => {
        const claimerId = 13;
        const claim = pendingClaims[claimerId];
        const merkleProof = merkleTree.getHexProof(elements[claimerId]);
        const claimer = await (0, _src_1.impersonate)(claim.address, (0, numbers_1.fp)(10));
        const claims = [
            {
                distributionId: (0, numbers_1.bn)(1),
                balance: claim.amount,
                distributor: distributor.address,
                tokenIndex: 0,
                merkleProof,
            },
        ];
        const tx = await merkleOrchard.connect(claimer).claimDistributions(claimer.address, claims, [LDO_ADDRESS]);
        await (0, expectTransfer_1.expectTransferEvent)(await tx.wait(), { from: await merkleOrchard.getVault(), to: claimer.address, value: claim.amount }, ldoToken);
    });
    it('reverts when claiming twice in the same transaction', async () => {
        const claimerId = 17;
        const claim = pendingClaims[claimerId];
        const merkleProof = merkleTree.getHexProof(elements[claimerId]);
        const claimer = await (0, _src_1.impersonate)(claim.address, (0, numbers_1.fp)(10));
        const claims = [
            {
                distributionId: (0, numbers_1.bn)(1),
                balance: claim.amount,
                distributor: distributor.address,
                tokenIndex: 0,
                merkleProof,
            },
            {
                distributionId: (0, numbers_1.bn)(1),
                balance: claim.amount,
                distributor: distributor.address,
                tokenIndex: 0,
                merkleProof,
            },
        ];
        await (0, chai_1.expect)(merkleOrchard.connect(claimer).claimDistributions(claimer.address, claims, [LDO_ADDRESS])).to.be.revertedWith('cannot claim twice');
    });
    function encodeElement(address, balance) {
        return hardhat_2.ethers.utils.solidityKeccak256(['address', 'uint'], [address, balance]);
    }
});
