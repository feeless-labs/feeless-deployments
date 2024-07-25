"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolKind = exports.exemptFlags = exports.cacheDurations = exports.rateProviders = exports.initialBalances = exports.initialBalanceUSDC = exports.initialBalanceDAI = exports.swapFeePercentage = exports.amplificationParameter = exports.tokens = exports.USDC = exports.DAI = void 0;
const constants_1 = require("@helpers/constants");
const numbers_1 = require("@helpers/numbers");
exports.DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
exports.USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
exports.tokens = [exports.DAI, exports.USDC];
exports.amplificationParameter = (0, numbers_1.bn)(100);
exports.swapFeePercentage = (0, numbers_1.fp)(0.01);
exports.initialBalanceDAI = (0, numbers_1.fp)(1e6);
exports.initialBalanceUSDC = (0, numbers_1.fp)(1e6).div(1e12); // 6 digits
exports.initialBalances = [exports.initialBalanceDAI, exports.initialBalanceUSDC];
exports.rateProviders = [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS];
exports.cacheDurations = [numbers_1.FP_ZERO, numbers_1.FP_ZERO];
exports.exemptFlags = [false, false];
var PoolKind;
(function (PoolKind) {
    PoolKind[PoolKind["WEIGHTED"] = 0] = "WEIGHTED";
    PoolKind[PoolKind["LEGACY_STABLE"] = 1] = "LEGACY_STABLE";
    PoolKind[PoolKind["COMPOSABLE_STABLE"] = 2] = "COMPOSABLE_STABLE";
    PoolKind[PoolKind["COMPOSABLE_STABLE_V2"] = 3] = "COMPOSABLE_STABLE_V2";
})(PoolKind = exports.PoolKind || (exports.PoolKind = {}));
