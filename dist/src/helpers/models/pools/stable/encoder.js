"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StablePoolEncoder = exports.StablePoolExitKind = exports.StablePoolJoinKind = void 0;
const abi_1 = require("@ethersproject/abi");
var StablePoolJoinKind;
(function (StablePoolJoinKind) {
    StablePoolJoinKind[StablePoolJoinKind["INIT"] = 0] = "INIT";
    StablePoolJoinKind[StablePoolJoinKind["EXACT_TOKENS_IN_FOR_BPT_OUT"] = 1] = "EXACT_TOKENS_IN_FOR_BPT_OUT";
    StablePoolJoinKind[StablePoolJoinKind["TOKEN_IN_FOR_EXACT_BPT_OUT"] = 2] = "TOKEN_IN_FOR_EXACT_BPT_OUT";
    StablePoolJoinKind[StablePoolJoinKind["ALL_TOKENS_IN_FOR_EXACT_BPT_OUT"] = 3] = "ALL_TOKENS_IN_FOR_EXACT_BPT_OUT";
})(StablePoolJoinKind = exports.StablePoolJoinKind || (exports.StablePoolJoinKind = {}));
var StablePoolExitKind;
(function (StablePoolExitKind) {
    StablePoolExitKind[StablePoolExitKind["EXACT_BPT_IN_FOR_ONE_TOKEN_OUT"] = 0] = "EXACT_BPT_IN_FOR_ONE_TOKEN_OUT";
    StablePoolExitKind[StablePoolExitKind["BPT_IN_FOR_EXACT_TOKENS_OUT"] = 1] = "BPT_IN_FOR_EXACT_TOKENS_OUT";
    StablePoolExitKind[StablePoolExitKind["EXACT_BPT_IN_FOR_ALL_TOKENS_OUT"] = 2] = "EXACT_BPT_IN_FOR_ALL_TOKENS_OUT";
})(StablePoolExitKind = exports.StablePoolExitKind || (exports.StablePoolExitKind = {}));
class StablePoolEncoder {
    /**
     * Cannot be constructed.
     */
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    }
}
exports.StablePoolEncoder = StablePoolEncoder;
/**
 * Encodes the userData parameter for providing the initial liquidity to a StablePool
 * @param initialBalances - the amounts of tokens to send to the pool to form the initial balances
 */
StablePoolEncoder.joinInit = (amountsIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256[]'], [StablePoolJoinKind.INIT, amountsIn]);
/**
 * Encodes the userData parameter for joining a StablePool with exact token inputs
 * @param amountsIn - the amounts each of token to deposit in the pool as liquidity
 * @param minimumBPT - the minimum acceptable BPT to receive in return for deposited tokens
 */
StablePoolEncoder.joinExactTokensInForBPTOut = (amountsIn, minimumBPT) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256[]', 'uint256'], [StablePoolJoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, amountsIn, minimumBPT]);
/**
 * Encodes the userData parameter for joining a StablePool with to receive an exact amount of BPT
 * @param bptAmountOut - the amount of BPT to be minted
 * @param enterTokenIndex - the index of the token to be provided as liquidity
 */
StablePoolEncoder.joinTokenInForExactBPTOut = (bptAmountOut, enterTokenIndex) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256'], [StablePoolJoinKind.TOKEN_IN_FOR_EXACT_BPT_OUT, bptAmountOut, enterTokenIndex]);
/**
 * Encodes the userData parameter for joining a StablePool proportionally
 * @param bptAmountOut - the amount of BPT to be minted
 */
StablePoolEncoder.joinAllTokensInForExactBptOut = (bptAmountOut) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [StablePoolJoinKind.ALL_TOKENS_IN_FOR_EXACT_BPT_OUT, bptAmountOut]);
/**
 * Encodes the userData parameter for exiting a StablePool by removing a single token in return for an exact amount of BPT
 * @param bptAmountIn - the amount of BPT to be burned
 * @param exitTokenIndex - the index of the token to removed from the pool
 */
StablePoolEncoder.exitExactBPTInForOneTokenOut = (bptAmountIn, exitTokenIndex) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256'], [StablePoolExitKind.EXACT_BPT_IN_FOR_ONE_TOKEN_OUT, bptAmountIn, exitTokenIndex]);
/**
 * Encodes the userData parameter for exiting a StablePool by removing exact amounts of tokens
 * @param amountsOut - the amounts of each token to be withdrawn from the pool
 * @param maxBPTAmountIn - the minimum acceptable BPT to burn in return for withdrawn tokens
 */
StablePoolEncoder.exitBPTInForExactTokensOut = (amountsOut, maxBPTAmountIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256[]', 'uint256'], [StablePoolExitKind.BPT_IN_FOR_EXACT_TOKENS_OUT, amountsOut, maxBPTAmountIn]);
/**
 * Encodes the userData parameter for exiting a StablePool proportionally
 * @param bptAmountIn - the amount of BPT to burn in exchange for withdrawn tokens
 */
StablePoolEncoder.exitExactBptInForTokensOut = (bptAmountIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [StablePoolExitKind.EXACT_BPT_IN_FOR_ALL_TOKENS_OUT, bptAmountIn]);
