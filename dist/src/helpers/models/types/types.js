"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolFee = exports.GaugeType = exports.PoolBalanceOpKind = exports.UserBalanceOpKind = exports.SwapKind = exports.PoolSpecialization = void 0;
var PoolSpecialization;
(function (PoolSpecialization) {
    PoolSpecialization[PoolSpecialization["GeneralPool"] = 0] = "GeneralPool";
    PoolSpecialization[PoolSpecialization["MinimalSwapInfoPool"] = 1] = "MinimalSwapInfoPool";
    PoolSpecialization[PoolSpecialization["TwoTokenPool"] = 2] = "TwoTokenPool";
})(PoolSpecialization = exports.PoolSpecialization || (exports.PoolSpecialization = {}));
// Swaps
var SwapKind;
(function (SwapKind) {
    SwapKind[SwapKind["GivenIn"] = 0] = "GivenIn";
    SwapKind[SwapKind["GivenOut"] = 1] = "GivenOut";
})(SwapKind = exports.SwapKind || (exports.SwapKind = {}));
// Balance Operations
var UserBalanceOpKind;
(function (UserBalanceOpKind) {
    UserBalanceOpKind[UserBalanceOpKind["DepositInternal"] = 0] = "DepositInternal";
    UserBalanceOpKind[UserBalanceOpKind["WithdrawInternal"] = 1] = "WithdrawInternal";
    UserBalanceOpKind[UserBalanceOpKind["TransferInternal"] = 2] = "TransferInternal";
    UserBalanceOpKind[UserBalanceOpKind["TransferExternal"] = 3] = "TransferExternal";
})(UserBalanceOpKind = exports.UserBalanceOpKind || (exports.UserBalanceOpKind = {}));
var PoolBalanceOpKind;
(function (PoolBalanceOpKind) {
    PoolBalanceOpKind[PoolBalanceOpKind["Withdraw"] = 0] = "Withdraw";
    PoolBalanceOpKind[PoolBalanceOpKind["Deposit"] = 1] = "Deposit";
    PoolBalanceOpKind[PoolBalanceOpKind["Update"] = 2] = "Update";
})(PoolBalanceOpKind = exports.PoolBalanceOpKind || (exports.PoolBalanceOpKind = {}));
// Stakeless gauges
var GaugeType;
(function (GaugeType) {
    GaugeType[GaugeType["LiquidityMiningCommittee"] = 0] = "LiquidityMiningCommittee";
    GaugeType[GaugeType["veBAL"] = 1] = "veBAL";
    GaugeType[GaugeType["Ethereum"] = 2] = "Ethereum";
    GaugeType[GaugeType["Polygon"] = 3] = "Polygon";
    GaugeType[GaugeType["Arbitrum"] = 4] = "Arbitrum";
    GaugeType[GaugeType["Optimism"] = 5] = "Optimism";
    GaugeType[GaugeType["Gnosis"] = 6] = "Gnosis";
    GaugeType[GaugeType["ZkSync"] = 7] = "ZkSync";
})(GaugeType = exports.GaugeType || (exports.GaugeType = {}));
var ProtocolFee;
(function (ProtocolFee) {
    ProtocolFee[ProtocolFee["SWAP"] = 0] = "SWAP";
    ProtocolFee[ProtocolFee["FLASH_LOAN"] = 1] = "FLASH_LOAN";
    ProtocolFee[ProtocolFee["YIELD"] = 2] = "YIELD";
    ProtocolFee[ProtocolFee["AUM"] = 3] = "AUM";
})(ProtocolFee = exports.ProtocolFee || (exports.ProtocolFee = {}));
