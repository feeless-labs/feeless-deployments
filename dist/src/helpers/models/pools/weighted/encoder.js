"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagedPoolEncoder = exports.WeightedPoolEncoder = exports.WeightedPoolExitKind = exports.WeightedPoolJoinKind = void 0;
const abi_1 = require("@ethersproject/abi");
var WeightedPoolJoinKind;
(function (WeightedPoolJoinKind) {
    WeightedPoolJoinKind[WeightedPoolJoinKind["INIT"] = 0] = "INIT";
    WeightedPoolJoinKind[WeightedPoolJoinKind["EXACT_TOKENS_IN_FOR_BPT_OUT"] = 1] = "EXACT_TOKENS_IN_FOR_BPT_OUT";
    WeightedPoolJoinKind[WeightedPoolJoinKind["TOKEN_IN_FOR_EXACT_BPT_OUT"] = 2] = "TOKEN_IN_FOR_EXACT_BPT_OUT";
    WeightedPoolJoinKind[WeightedPoolJoinKind["ALL_TOKENS_IN_FOR_EXACT_BPT_OUT"] = 3] = "ALL_TOKENS_IN_FOR_EXACT_BPT_OUT";
    WeightedPoolJoinKind[WeightedPoolJoinKind["ADD_TOKEN"] = 4] = "ADD_TOKEN";
})(WeightedPoolJoinKind = exports.WeightedPoolJoinKind || (exports.WeightedPoolJoinKind = {}));
var WeightedPoolExitKind;
(function (WeightedPoolExitKind) {
    WeightedPoolExitKind[WeightedPoolExitKind["EXACT_BPT_IN_FOR_ONE_TOKEN_OUT"] = 0] = "EXACT_BPT_IN_FOR_ONE_TOKEN_OUT";
    WeightedPoolExitKind[WeightedPoolExitKind["EXACT_BPT_IN_FOR_TOKENS_OUT"] = 1] = "EXACT_BPT_IN_FOR_TOKENS_OUT";
    WeightedPoolExitKind[WeightedPoolExitKind["BPT_IN_FOR_EXACT_TOKENS_OUT"] = 2] = "BPT_IN_FOR_EXACT_TOKENS_OUT";
    WeightedPoolExitKind[WeightedPoolExitKind["REMOVE_TOKEN"] = 3] = "REMOVE_TOKEN";
})(WeightedPoolExitKind = exports.WeightedPoolExitKind || (exports.WeightedPoolExitKind = {}));
class WeightedPoolEncoder {
    /**
     * Cannot be constructed.
     */
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    }
}
exports.WeightedPoolEncoder = WeightedPoolEncoder;
/**
 * Encodes the userData parameter for providing the initial liquidity to a WeightedPool
 * @param initialBalances - the amounts of tokens to send to the pool to form the initial balances
 */
WeightedPoolEncoder.joinInit = (amountsIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256[]'], [WeightedPoolJoinKind.INIT, amountsIn]);
/**
 * Encodes the userData parameter for joining a WeightedPool with exact token inputs
 * @param amountsIn - the amounts each of token to deposit in the pool as liquidity
 * @param minimumBPT - the minimum acceptable BPT to receive in return for deposited tokens
 */
WeightedPoolEncoder.joinExactTokensInForBPTOut = (amountsIn, minimumBPT) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256[]', 'uint256'], [WeightedPoolJoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, amountsIn, minimumBPT]);
/**
 * Encodes the userData parameter for joining a WeightedPool with a single token to receive an exact amount of BPT
 * @param bptAmountOut - the amount of BPT to be minted
 * @param enterTokenIndex - the index of the token to be provided as liquidity
 */
WeightedPoolEncoder.joinTokenInForExactBPTOut = (bptAmountOut, enterTokenIndex) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256'], [WeightedPoolJoinKind.TOKEN_IN_FOR_EXACT_BPT_OUT, bptAmountOut, enterTokenIndex]);
/**
 * Encodes the userData parameter for joining a WeightedPool proportionally to receive an exact amount of BPT
 * @param bptAmountOut - the amount of BPT to be minted
 */
WeightedPoolEncoder.joinAllTokensInForExactBPTOut = (bptAmountOut) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [WeightedPoolJoinKind.ALL_TOKENS_IN_FOR_EXACT_BPT_OUT, bptAmountOut]);
/**
 * Encodes the userData parameter for exiting a WeightedPool by removing a single token in return for an exact amount of BPT
 * @param bptAmountIn - the amount of BPT to be burned
 * @param enterTokenIndex - the index of the token to removed from the pool
 */
WeightedPoolEncoder.exitExactBPTInForOneTokenOut = (bptAmountIn, exitTokenIndex) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256'], [WeightedPoolExitKind.EXACT_BPT_IN_FOR_ONE_TOKEN_OUT, bptAmountIn, exitTokenIndex]);
/**
 * Encodes the userData parameter for exiting a WeightedPool by removing tokens in return for an exact amount of BPT
 * @param bptAmountIn - the amount of BPT to be burned
 */
WeightedPoolEncoder.exitExactBPTInForTokensOut = (bptAmountIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [WeightedPoolExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptAmountIn]);
/**
 * Encodes the userData parameter for exiting a WeightedPool by removing exact amounts of tokens
 * @param amountsOut - the amounts of each token to be withdrawn from the pool
 * @param maxBPTAmountIn - the minimum acceptable BPT to burn in return for withdrawn tokens
 */
WeightedPoolEncoder.exitBPTInForExactTokensOut = (amountsOut, maxBPTAmountIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256[]', 'uint256'], [WeightedPoolExitKind.BPT_IN_FOR_EXACT_TOKENS_OUT, amountsOut, maxBPTAmountIn]);
class ManagedPoolEncoder {
    /**
     * Cannot be constructed.
     */
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    }
}
exports.ManagedPoolEncoder = ManagedPoolEncoder;
/**
 * Encodes the userData parameter for exiting a ManagedPool to remove a token.
 * This can only be done by the pool owner.
 */
ManagedPoolEncoder.exitForRemoveToken = (tokenIndex) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [WeightedPoolExitKind.REMOVE_TOKEN, tokenIndex]);
