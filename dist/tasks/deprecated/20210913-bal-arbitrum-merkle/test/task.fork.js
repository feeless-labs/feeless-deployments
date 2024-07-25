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
const numbers_1 = require("@helpers/numbers");
const relativeError_1 = require("@helpers/relativeError");
const merkleTree_1 = require("@helpers/merkleTree");
const constants_1 = require("@helpers/constants");
const _src_1 = require("@src");
function encodeElement(address, balance) {
    return hardhat_1.ethers.utils.solidityKeccak256(['address', 'uint'], [address, balance]);
}
(0, _src_1.describeForkTest)('MerkleRedeem', 'arbitrum', 846769, function () {
    let lp, other, whale;
    let distributor, token;
    let task;
    const BAL_TOKEN_ADDRESS = '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8'; // BAL on arbitrum
    const BAL_WHALE_ADDRESS = '0x056d433ad1eafcab3c4544bf4f98b9f40b1b1738';
    before('run task', async () => {
        task = new _src_1.Task('20210913-bal-arbitrum-merkle', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        distributor = await task.instanceAt('MerkleRedeem', task.output().MerkleRedeem);
    });
    before('load signers and transfer ownership', async () => {
        lp = await (0, _src_1.getSigner)(2);
        other = await (0, _src_1.getSigner)(3);
        whale = await (0, _src_1.impersonate)(BAL_WHALE_ADDRESS);
        token = await task.instanceAt('IERC20', BAL_TOKEN_ADDRESS);
        await distributor.transferOwnership(whale.address);
        await token.connect(whale).approve(distributor.address, constants_1.MAX_UINT256);
    });
    describe('with an allocation defined', async () => {
        let root;
        let proof;
        before(() => {
            const elements = [encodeElement(lp.address, (0, numbers_1.fp)(66)), encodeElement(other.address, (0, numbers_1.fp)(34))];
            const merkleTree = new merkleTree_1.MerkleTree(elements);
            root = merkleTree.getHexRoot();
            proof = merkleTree.getHexProof(elements[0]);
        });
        it('can seed an allocation', async () => {
            await distributor.connect(whale).seedAllocations((0, numbers_1.bn)(0), root, (0, numbers_1.fp)(100));
            const expectedReward = (0, numbers_1.fp)(100);
            (0, relativeError_1.expectEqualWithError)(await token.balanceOf(distributor.address), expectedReward, (0, numbers_1.fp)(1));
        });
        it('can claim a reward', async () => {
            await distributor.connect(whale).seedAllocations((0, numbers_1.bn)(1), root, (0, numbers_1.fp)(100));
            await distributor.connect(lp).claimWeek(lp.address, (0, numbers_1.bn)(1), (0, numbers_1.fp)(66), proof);
            (0, relativeError_1.expectEqualWithError)(await token.balanceOf(lp.address), (0, numbers_1.fp)(66), (0, numbers_1.fp)(1));
        });
    });
});
