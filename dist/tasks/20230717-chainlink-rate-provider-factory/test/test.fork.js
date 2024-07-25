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
const _src_1 = require("@src");
const expectEvent = __importStar(require("@helpers/expectEvent"));
const constants_1 = require("@helpers/constants");
const numbers_1 = require("@helpers/numbers");
(0, _src_1.describeForkTest)('ChainlinkRateProviderFactory', 'mainnet', 17717232, function () {
    let task;
    let usdcPriceFeed, rateProviderFactory, rateProvider;
    const usdcPriceFeedAddress = '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6';
    before('run task', async () => {
        task = new _src_1.Task('20230717-chainlink-rate-provider-factory', _src_1.TaskMode.TEST, (0, _src_1.getForkedNetwork)(hardhat_1.default));
        await task.run({ force: true });
        usdcPriceFeed = await task.instanceAt('AggregatorV3Interface', usdcPriceFeedAddress);
        rateProviderFactory = await task.deployedInstance('ChainlinkRateProviderFactory');
    });
    before('create a ChainLinkRateProvider', async () => {
        const receipt = await (await rateProviderFactory.create(usdcPriceFeed.address)).wait();
        const event = await expectEvent.inReceipt(receipt, 'RateProviderCreated');
        rateProvider = await task.instanceAt('ChainlinkRateProvider', event.args.rateProvider);
        (0, chai_1.expect)(rateProvider.address).to.not.equal(constants_1.ZERO_ADDRESS);
        (0, chai_1.expect)(await rateProviderFactory.isRateProviderFromFactory(rateProvider.address)).to.be.true;
    });
    it('rate is about 1 USD per USDC', async () => {
        (0, chai_1.expect)(await rateProvider.getRate()).to.almostEqual((0, numbers_1.fp)(1));
    });
});
