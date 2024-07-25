"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBPTPrice = exports.calculateSpotPrice = exports.calculateMaxOneTokenSwapFeeAmount = exports.calculateBPTSwapFeeAmount = exports.calculateOneTokenSwapFeeAmount = exports.calcTokensOutGivenExactBptIn = exports.calcTokenOutGivenExactBptIn = exports.calcBptInGivenExactTokensOut = exports.calcTokenInGivenExactBptOut = exports.calcBptOutGivenExactTokensIn = exports.calcInGivenOut = exports.calcOutGivenIn = exports.calculateInvariant = void 0;
const numbers_1 = require("../../../numbers");
function calculateInvariant(fpRawBalances, fpRawWeights) {
    const normalizedWeights = fpRawWeights.map(numbers_1.fromFp);
    const balances = fpRawBalances.map(numbers_1.decimal);
    const invariant = balances.reduce((inv, balance, i) => inv.mul(balance.pow(normalizedWeights[i])), (0, numbers_1.decimal)(1));
    return (0, numbers_1.bn)(invariant);
}
exports.calculateInvariant = calculateInvariant;
function calcOutGivenIn(fpBalanceIn, fpWeightIn, fpBalanceOut, fpWeightOut, fpAmountIn) {
    const newBalance = (0, numbers_1.fromFp)(fpBalanceIn).add((0, numbers_1.fromFp)(fpAmountIn));
    const base = (0, numbers_1.fromFp)(fpBalanceIn).div(newBalance);
    const exponent = (0, numbers_1.fromFp)(fpWeightIn).div((0, numbers_1.fromFp)(fpWeightOut));
    const ratio = (0, numbers_1.decimal)(1).sub(base.pow(exponent));
    return (0, numbers_1.toFp)((0, numbers_1.fromFp)(fpBalanceOut).mul(ratio));
}
exports.calcOutGivenIn = calcOutGivenIn;
function calcInGivenOut(fpBalanceIn, fpWeightIn, fpBalanceOut, fpWeightOut, fpAmountOut) {
    const newBalance = (0, numbers_1.fromFp)(fpBalanceOut).sub((0, numbers_1.fromFp)(fpAmountOut));
    const base = (0, numbers_1.fromFp)(fpBalanceOut).div(newBalance);
    const exponent = (0, numbers_1.fromFp)(fpWeightOut).div((0, numbers_1.fromFp)(fpWeightIn));
    const ratio = base.pow(exponent).sub(1);
    return (0, numbers_1.toFp)((0, numbers_1.fromFp)(fpBalanceIn).mul(ratio));
}
exports.calcInGivenOut = calcInGivenOut;
function calcBptOutGivenExactTokensIn(fpBalances, fpWeights, fpAmountsIn, fpBptTotalSupply, fpSwapFeePercentage) {
    const weights = fpWeights.map(numbers_1.fromFp);
    const balances = fpBalances.map(numbers_1.fromFp);
    const amountsIn = fpAmountsIn.map(numbers_1.fromFp);
    const bptTotalSupply = (0, numbers_1.fromFp)(fpBptTotalSupply);
    const balanceRatiosWithFee = [];
    let invariantRatioWithFees = (0, numbers_1.decimal)(0);
    for (let i = 0; i < balances.length; i++) {
        balanceRatiosWithFee[i] = balances[i].add(amountsIn[i]).div(balances[i]);
        invariantRatioWithFees = invariantRatioWithFees.add(balanceRatiosWithFee[i].mul(weights[i]));
    }
    let invariantRatio = (0, numbers_1.decimal)(1);
    for (let i = 0; i < balances.length; i++) {
        let amountInWithoutFee;
        if (balanceRatiosWithFee[i].gt(invariantRatioWithFees)) {
            const nonTaxableAmount = balances[i].mul(invariantRatioWithFees.sub(1));
            const taxableAmount = amountsIn[i].sub(nonTaxableAmount);
            amountInWithoutFee = nonTaxableAmount.add(taxableAmount.mul((0, numbers_1.decimal)(1).sub((0, numbers_1.fromFp)(fpSwapFeePercentage))));
        }
        else {
            amountInWithoutFee = amountsIn[i];
        }
        const tokenBalanceRatio = balances[i].add(amountInWithoutFee).div(balances[i]);
        invariantRatio = invariantRatio.mul(tokenBalanceRatio.pow(weights[i]));
    }
    const bptOut = bptTotalSupply.mul(invariantRatio.sub(1));
    return (0, numbers_1.fp)(bptOut);
}
exports.calcBptOutGivenExactTokensIn = calcBptOutGivenExactTokensIn;
function calcTokenInGivenExactBptOut(tokenIndex, fpBalances, fpWeights, fpBptAmountOut, fpBptTotalSupply, fpSwapFeePercentage) {
    const bptAmountOut = (0, numbers_1.fromFp)(fpBptAmountOut);
    const bptTotalSupply = (0, numbers_1.fromFp)(fpBptTotalSupply);
    const weight = (0, numbers_1.fromFp)(fpWeights[tokenIndex]);
    const balance = fpBalances.map(numbers_1.fromFp)[tokenIndex];
    const swapFeePercentage = (0, numbers_1.fromFp)(fpSwapFeePercentage);
    const invariantRatio = bptTotalSupply.add(bptAmountOut).div(bptTotalSupply);
    const tokenBalanceRatio = invariantRatio.pow((0, numbers_1.decimal)(1).div(weight));
    const tokenBalancePercentageExcess = (0, numbers_1.decimal)(1).sub(weight);
    const amountInAfterFee = balance.mul(tokenBalanceRatio.sub((0, numbers_1.decimal)(1)));
    const amountIn = amountInAfterFee.div((0, numbers_1.decimal)(1).sub(tokenBalancePercentageExcess.mul(swapFeePercentage)));
    return (0, numbers_1.fp)(amountIn);
}
exports.calcTokenInGivenExactBptOut = calcTokenInGivenExactBptOut;
function calcBptInGivenExactTokensOut(fpBalances, fpWeights, fpAmountsOut, fpBptTotalSupply, fpSwapFeePercentage) {
    const swapFeePercentage = (0, numbers_1.fromFp)(fpSwapFeePercentage);
    const weights = fpWeights.map(numbers_1.fromFp);
    const balances = fpBalances.map(numbers_1.fromFp);
    const amountsOut = fpAmountsOut.map(numbers_1.fromFp);
    const bptTotalSupply = (0, numbers_1.fromFp)(fpBptTotalSupply);
    const balanceRatiosWithoutFee = [];
    let weightedBalanceRatio = (0, numbers_1.decimal)(0);
    for (let i = 0; i < balances.length; i++) {
        const balanceRatioWithoutFee = balances[i].sub(amountsOut[i]).div(balances[i]);
        balanceRatiosWithoutFee.push(balanceRatioWithoutFee);
        weightedBalanceRatio = weightedBalanceRatio.add(balanceRatioWithoutFee.mul(weights[i]));
    }
    let invariantRatio = (0, numbers_1.decimal)(1);
    for (let i = 0; i < balances.length; i++) {
        const tokenBalancePercentageExcess = weightedBalanceRatio.lte(balanceRatiosWithoutFee[i])
            ? 0
            : weightedBalanceRatio.sub(balanceRatiosWithoutFee[i]).div((0, numbers_1.decimal)(1).sub(balanceRatiosWithoutFee[i]));
        const amountOutBeforeFee = amountsOut[i].div((0, numbers_1.decimal)(1).sub(swapFeePercentage.mul(tokenBalancePercentageExcess)));
        const tokenBalanceRatio = (0, numbers_1.decimal)(1).sub(amountOutBeforeFee.div(balances[i]));
        invariantRatio = invariantRatio.mul(tokenBalanceRatio.pow(weights[i]));
    }
    const bptIn = bptTotalSupply.mul((0, numbers_1.decimal)(1).sub(invariantRatio));
    return (0, numbers_1.fp)(bptIn);
}
exports.calcBptInGivenExactTokensOut = calcBptInGivenExactTokensOut;
function calcTokenOutGivenExactBptIn(tokenIndex, fpBalances, fpWeights, fpBptAmountIn, fpBptTotalSupply, fpSwapFeePercentage) {
    const bptAmountIn = (0, numbers_1.fromFp)(fpBptAmountIn);
    const bptTotalSupply = (0, numbers_1.fromFp)(fpBptTotalSupply);
    const swapFeePercentage = (0, numbers_1.fromFp)(fpSwapFeePercentage);
    const weight = (0, numbers_1.fromFp)(fpWeights[tokenIndex]);
    const balance = fpBalances.map(numbers_1.fromFp)[tokenIndex];
    const invariantRatio = bptTotalSupply.sub(bptAmountIn).div(bptTotalSupply);
    const tokenBalanceRatio = invariantRatio.pow((0, numbers_1.decimal)(1).div(weight));
    const tokenBalancePercentageExcess = (0, numbers_1.decimal)(1).sub(weight);
    const amountOutBeforeFee = balance.mul((0, numbers_1.decimal)(1).sub(tokenBalanceRatio));
    const amountOut = amountOutBeforeFee.mul((0, numbers_1.decimal)(1).sub(tokenBalancePercentageExcess.mul(swapFeePercentage)));
    return (0, numbers_1.fp)(amountOut);
}
exports.calcTokenOutGivenExactBptIn = calcTokenOutGivenExactBptIn;
function calcTokensOutGivenExactBptIn(fpBalances, fpBptAmountIn, fpBptTotalSupply) {
    const balances = fpBalances.map(numbers_1.fromFp);
    const bptRatio = (0, numbers_1.fromFp)(fpBptAmountIn).div((0, numbers_1.fromFp)(fpBptTotalSupply));
    const amountsOut = balances.map((balance) => balance.mul(bptRatio));
    return amountsOut.map(numbers_1.fp);
}
exports.calcTokensOutGivenExactBptIn = calcTokensOutGivenExactBptIn;
function calculateOneTokenSwapFeeAmount(fpBalances, fpWeights, lastInvariant, tokenIndex) {
    const balance = fpBalances.map(numbers_1.fromFp)[tokenIndex];
    const weight = (0, numbers_1.fromFp)(fpWeights[tokenIndex]);
    const exponent = (0, numbers_1.decimal)(1).div(weight);
    const currentInvariant = calculateInvariant(fpBalances, fpWeights);
    const invariantRatio = (0, numbers_1.decimal)(lastInvariant).div((0, numbers_1.decimal)(currentInvariant));
    const accruedFees = balance.mul((0, numbers_1.decimal)(1).sub(invariantRatio.pow(exponent)));
    return (0, numbers_1.toFp)(accruedFees);
}
exports.calculateOneTokenSwapFeeAmount = calculateOneTokenSwapFeeAmount;
function calculateBPTSwapFeeAmount(fpInvariantGrowthRatio, preSupply, postSupply, fpProtocolSwapFeePercentage) {
    const supplyGrowthRatio = (0, numbers_1.fpDiv)(postSupply, preSupply);
    if ((0, numbers_1.bn)(fpInvariantGrowthRatio).lte(supplyGrowthRatio)) {
        return (0, numbers_1.bn)(0);
    }
    const swapFeePercentage = numbers_1.FP_100_PCT.sub((0, numbers_1.fpDiv)(supplyGrowthRatio, fpInvariantGrowthRatio));
    const k = (0, numbers_1.fpMul)(swapFeePercentage, fpProtocolSwapFeePercentage);
    const numerator = (0, numbers_1.bn)(postSupply).mul(k);
    const denominator = numbers_1.FP_ONE.sub(k);
    return numerator.div(denominator);
}
exports.calculateBPTSwapFeeAmount = calculateBPTSwapFeeAmount;
function calculateMaxOneTokenSwapFeeAmount(fpBalances, fpWeights, fpMinInvariantRatio, tokenIndex) {
    const balance = fpBalances.map(numbers_1.fromFp)[tokenIndex];
    const weight = (0, numbers_1.fromFp)(fpWeights[tokenIndex]);
    const exponent = (0, numbers_1.decimal)(1).div(weight);
    const maxAccruedFees = balance.mul((0, numbers_1.decimal)(1).sub((0, numbers_1.fromFp)(fpMinInvariantRatio).pow(exponent)));
    return (0, numbers_1.toFp)(maxAccruedFees);
}
exports.calculateMaxOneTokenSwapFeeAmount = calculateMaxOneTokenSwapFeeAmount;
function calculateSpotPrice(fpBalances, fpWeights) {
    const numerator = (0, numbers_1.fromFp)(fpBalances[0]).div((0, numbers_1.fromFp)(fpWeights[0]));
    const denominator = (0, numbers_1.fromFp)(fpBalances[1]).div((0, numbers_1.fromFp)(fpWeights[1]));
    return (0, numbers_1.bn)((0, numbers_1.toFp)(numerator.div(denominator)).toFixed(0));
}
exports.calculateSpotPrice = calculateSpotPrice;
function calculateBPTPrice(fpBalance, fpWeight, totalSupply) {
    return (0, numbers_1.bn)((0, numbers_1.toFp)((0, numbers_1.fromFp)(fpBalance).div((0, numbers_1.fromFp)(fpWeight)).div((0, numbers_1.fromFp)(totalSupply))).toFixed(0));
}
exports.calculateBPTPrice = calculateBPTPrice;
