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
(0, _src_1.describeForkTest)('ChildChainGaugeCheckpointer (BalancerRelayer)', 'polygon', 44244700, function () {
    let task;
    let relayer, library;
    let user;
    const gauges = [
        '0x4f23CCC4349E9500d27C7096bD61d203F1D1C1Aa',
        '0x1F0ee42D005b89814a01f050416b28c3142ac900',
        '0x51416C00388bB4644E28546c77AEe768036F17A8',
    ];
    const userAddress = '0x71003c3fe8497d434ff2aea3adda42f2728d8176';
    const version = JSON.stringify({
        name: 'ChildChainGauge checkpointer (BalancerRelayer)',
        version: 5.1,
        deployment: '20230712-child-chain-gauge-checkpointer',
    });
    before('run task', async () => {
        task = new _src_1.Task('20230712-child-chain-gauge-checkpointer', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        library = await task.deployedInstance('BatchRelayerLibrary');
        relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });
    before('load signers', async () => {
        // We impersonate an account that holds staked BPT for the ETH_STETH Pool.
        user = await (0, _src_1.impersonate)(userAddress);
    });
    it('returns correct version', async () => {
        (0, chai_1.expect)(await relayer.version()).to.be.eq(version);
    });
    it('checkpoints gauges for user', async () => {
        const checkpointInterface = new hardhat_1.ethers.utils.Interface([
            'event UpdateLiquidityLimit(address indexed _user, uint256 _original_balance, uint256 _original_supply, uint256 _working_balance, uint256 _working_supply)',
        ]);
        const receipt = await (await library.gaugeCheckpoint(user.address, gauges)).wait();
        expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'UpdateLiquidityLimit', {}, gauges[0], 1);
        expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'UpdateLiquidityLimit', {}, gauges[1], 1);
        expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'UpdateLiquidityLimit', {}, gauges[2], 1);
    });
});
