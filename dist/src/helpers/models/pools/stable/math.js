"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenBalanceGivenInvariantAndAllOtherBalances = exports.calculateOneTokenSwapFeeAmount = exports.calcTokenOutGivenExactBptIn = exports.calcBptInGivenExactTokensOut = exports.calcTokenInGivenExactBptOut = exports.calcBptOutGivenExactTokensIn = exports.calcInGivenOut = exports.calcOutGivenIn = exports.calculateAnalyticalInvariantForTwoTokens = exports.calculateApproxInvariant = exports.calculateInvariant = void 0;
const numbers_1 = require("../../../numbers");
function calculateInvariant(fpRawBalances, amplificationParameter) {
    return calculateApproxInvariant(fpRawBalances, amplificationParameter);
}
exports.calculateInvariant = calculateInvariant;
function calculateApproxInvariant(fpRawBalances, amplificationParameter) {
    const totalCoins = fpRawBalances.length;
    const balances = fpRawBalances.map(numbers_1.fromFp);
    const sum = balances.reduce((a, b) => a.add(b), (0, numbers_1.decimal)(0));
    if (sum.isZero()) {
        return (0, numbers_1.bn)(0);
    }
    let inv = sum;
    let prevInv = (0, numbers_1.decimal)(0);
    const ampTimesTotal = (0, numbers_1.decimal)(amplificationParameter).mul(totalCoins);
    for (let i = 0; i < 255; i++) {
        let P_D = balances[0].mul(totalCoins);
        for (let j = 1; j < totalCoins; j++) {
            P_D = P_D.mul(balances[j]).mul(totalCoins).div(inv);
        }
        prevInv = inv;
        inv = (0, numbers_1.decimal)(totalCoins)
            .mul(inv)
            .mul(inv)
            .add(ampTimesTotal.mul(sum).mul(P_D))
            .div((0, numbers_1.decimal)(totalCoins).add(1).mul(inv).add(ampTimesTotal.sub(1).mul(P_D)));
        // converge with precision of integer 1
        if (inv.gt(prevInv)) {
            if ((0, numbers_1.fp)(inv).sub((0, numbers_1.fp)(prevInv)).lte(1)) {
                break;
            }
        }
        else if ((0, numbers_1.fp)(prevInv).sub((0, numbers_1.fp)(inv)).lte(1)) {
            break;
        }
    }
    return (0, numbers_1.fp)(inv);
}
exports.calculateApproxInvariant = calculateApproxInvariant;
function calculateAnalyticalInvariantForTwoTokens(fpRawBalances, amplificationParameter) {
    if (fpRawBalances.length !== 2) {
        throw 'Analytical invariant is solved only for 2 balances';
    }
    const sum = fpRawBalances.reduce((a, b) => a.add((0, numbers_1.fromFp)(b)), (0, numbers_1.decimal)(0));
    const prod = fpRawBalances.reduce((a, b) => a.mul((0, numbers_1.fromFp)(b)), (0, numbers_1.decimal)(1));
    // The amplification parameter equals to: A n^(n-1), where A is the amplification coefficient
    const amplificationCoefficient = (0, numbers_1.decimal)(amplificationParameter).div(2);
    //Q
    const q = amplificationCoefficient.mul(-16).mul(sum).mul(prod);
    //P
    const p = amplificationCoefficient.minus((0, numbers_1.decimal)(1).div(4)).mul(16).mul(prod);
    //C
    const c = q
        .pow(2)
        .div(4)
        .add(p.pow(3).div(27))
        .pow(1 / 2)
        .minus(q.div(2))
        .pow(1 / 3);
    const invariant = c.minus(p.div(c.mul(3)));
    return (0, numbers_1.fp)(invariant);
}
exports.calculateAnalyticalInvariantForTwoTokens = calculateAnalyticalInvariantForTwoTokens;
function calcOutGivenIn(fpBalances, amplificationParameter, tokenIndexIn, tokenIndexOut, fpTokenAmountIn) {
    const invariant = (0, numbers_1.fromFp)(calculateInvariant(fpBalances, amplificationParameter));
    const balances = fpBalances.map(numbers_1.fromFp);
    balances[tokenIndexIn] = balances[tokenIndexIn].add((0, numbers_1.fromFp)(fpTokenAmountIn));
    const finalBalanceOut = _getTokenBalanceGivenInvariantAndAllOtherBalances(balances, (0, numbers_1.decimal)(amplificationParameter), invariant, tokenIndexOut);
    return (0, numbers_1.toFp)(balances[tokenIndexOut].sub(finalBalanceOut));
}
exports.calcOutGivenIn = calcOutGivenIn;
function calcInGivenOut(fpBalances, amplificationParameter, tokenIndexIn, tokenIndexOut, fpTokenAmountOut) {
    const invariant = (0, numbers_1.fromFp)(calculateInvariant(fpBalances, amplificationParameter));
    const balances = fpBalances.map(numbers_1.fromFp);
    balances[tokenIndexOut] = balances[tokenIndexOut].sub((0, numbers_1.fromFp)(fpTokenAmountOut));
    const finalBalanceIn = _getTokenBalanceGivenInvariantAndAllOtherBalances(balances, (0, numbers_1.decimal)(amplificationParameter), invariant, tokenIndexIn);
    return (0, numbers_1.toFp)(finalBalanceIn.sub(balances[tokenIndexIn]));
}
exports.calcInGivenOut = calcInGivenOut;
function calcBptOutGivenExactTokensIn(fpBalances, amplificationParameter, fpAmountsIn, fpBptTotalSupply, fpCurrentInvariant, fpSwapFeePercentage) {
    // Get current invariant
    const currentInvariant = (0, numbers_1.fromFp)(fpCurrentInvariant);
    const balances = fpBalances.map(numbers_1.fromFp);
    const amountsIn = fpAmountsIn.map(numbers_1.fromFp);
    // First calculate the sum of all token balances which will be used to calculate
    // the current weights of each token relative to the sum of all balances
    const sumBalances = balances.reduce((a, b) => a.add(b), (0, numbers_1.decimal)(0));
    // Calculate the weighted balance ratio without considering fees
    const balanceRatiosWithFee = [];
    // The weighted sum of token balance rations sans fee
    let invariantRatioWithFees = (0, numbers_1.decimal)(0);
    for (let i = 0; i < balances.length; i++) {
        const currentWeight = balances[i].div(sumBalances);
        balanceRatiosWithFee[i] = balances[i].add(amountsIn[i]).div(balances[i]);
        invariantRatioWithFees = invariantRatioWithFees.add(balanceRatiosWithFee[i].mul(currentWeight));
    }
    // Second loop to calculate new amounts in taking into account the fee on the % excess
    for (let i = 0; i < balances.length; i++) {
        let amountInWithoutFee;
        // Check if the balance ratio is greater than the ideal ratio to charge fees or not
        if (balanceRatiosWithFee[i].gt(invariantRatioWithFees)) {
            const nonTaxableAmount = balances[i].mul(invariantRatioWithFees.sub(1));
            const taxableAmount = amountsIn[i].sub(nonTaxableAmount);
            amountInWithoutFee = nonTaxableAmount.add(taxableAmount.mul((0, numbers_1.decimal)(1).sub((0, numbers_1.fromFp)(fpSwapFeePercentage))));
        }
        else {
            amountInWithoutFee = amountsIn[i];
        }
        balances[i] = balances[i].add(amountInWithoutFee);
    }
    // Calculate the new invariant, taking swap fees into account
    const newInvariant = (0, numbers_1.fromFp)(calculateInvariant(balances.map(numbers_1.fp), amplificationParameter));
    const invariantRatio = newInvariant.div(currentInvariant);
    if (invariantRatio.gt(1)) {
        return (0, numbers_1.fp)((0, numbers_1.fromFp)(fpBptTotalSupply).mul(invariantRatio.sub(1)));
    }
    else {
        return (0, numbers_1.bn)(0);
    }
}
exports.calcBptOutGivenExactTokensIn = calcBptOutGivenExactTokensIn;
function calcTokenInGivenExactBptOut(tokenIndex, fpBalances, amplificationParameter, fpBptAmountOut, fpBptTotalSupply, fpCurrentInvariant, fpSwapFeePercentage) {
    // Calculate new invariant
    const newInvariant = (0, numbers_1.fromFp)((0, numbers_1.bn)(fpBptTotalSupply).add(fpBptAmountOut))
        .div((0, numbers_1.fromFp)(fpBptTotalSupply))
        .mul((0, numbers_1.fromFp)(fpCurrentInvariant));
    // First calculate the sum of all token balances which will be used to calculate
    // the current weight of token
    const balances = fpBalances.map(numbers_1.fromFp);
    const sumBalances = balances.reduce((a, b) => a.add(b), (0, numbers_1.decimal)(0));
    // Calculate amount in without fee.
    const newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(balances, amplificationParameter, newInvariant, tokenIndex);
    const amountInWithoutFee = newBalanceTokenIndex.sub(balances[tokenIndex]);
    // We can now compute how much extra balance is being deposited and used in virtual swaps, and charge swap fees
    // accordingly.
    const currentWeight = balances[tokenIndex].div(sumBalances);
    const taxablePercentage = currentWeight.gt(1) ? 0 : (0, numbers_1.decimal)(1).sub(currentWeight);
    const taxableAmount = amountInWithoutFee.mul(taxablePercentage);
    const nonTaxableAmount = amountInWithoutFee.sub(taxableAmount);
    const bptOut = nonTaxableAmount.add(taxableAmount.div((0, numbers_1.decimal)(1).sub((0, numbers_1.fromFp)(fpSwapFeePercentage))));
    return (0, numbers_1.fp)(bptOut);
}
exports.calcTokenInGivenExactBptOut = calcTokenInGivenExactBptOut;
function calcBptInGivenExactTokensOut(fpBalances, amplificationParameter, fpAmountsOut, fpBptTotalSupply, fpCurrentInvariant, fpSwapFeePercentage) {
    // Get current invariant
    const currentInvariant = (0, numbers_1.fromFp)(fpCurrentInvariant);
    const balances = fpBalances.map(numbers_1.fromFp);
    const amountsOut = fpAmountsOut.map(numbers_1.fromFp);
    // First calculate the sum of all token balances which will be used to calculate
    // the current weight of token
    const sumBalances = balances.reduce((a, b) => a.add(b), (0, numbers_1.decimal)(0));
    // Calculate the weighted balance ratio without considering fees
    const balanceRatiosWithoutFee = [];
    let invariantRatioWithoutFees = (0, numbers_1.decimal)(0);
    for (let i = 0; i < balances.length; i++) {
        const currentWeight = balances[i].div(sumBalances);
        balanceRatiosWithoutFee[i] = balances[i].sub(amountsOut[i]).div(balances[i]);
        invariantRatioWithoutFees = invariantRatioWithoutFees.add(balanceRatiosWithoutFee[i].mul(currentWeight));
    }
    // Second loop to calculate new amounts in taking into account the fee on the % excess
    for (let i = 0; i < balances.length; i++) {
        // Swap fees are typically charged on 'token in', but there is no 'token in' here, so we apply it to
        // 'token out'. This results in slightly larger price impact.
        let amountOutWithFee;
        if (invariantRatioWithoutFees.gt(balanceRatiosWithoutFee[i])) {
            const invariantRatioComplement = invariantRatioWithoutFees.gt(1)
                ? (0, numbers_1.decimal)(0)
                : (0, numbers_1.decimal)(1).sub(invariantRatioWithoutFees);
            const nonTaxableAmount = balances[i].mul(invariantRatioComplement);
            const taxableAmount = amountsOut[i].sub(nonTaxableAmount);
            amountOutWithFee = nonTaxableAmount.add(taxableAmount.div((0, numbers_1.decimal)(1).sub((0, numbers_1.fromFp)(fpSwapFeePercentage))));
        }
        else {
            amountOutWithFee = amountsOut[i];
        }
        balances[i] = balances[i].sub(amountOutWithFee);
    }
    // get new invariant taking into account swap fees
    const newInvariant = (0, numbers_1.fromFp)(calculateInvariant(balances.map(numbers_1.fp), amplificationParameter));
    // return amountBPTIn
    const invariantRatio = newInvariant.div(currentInvariant);
    const invariantRatioComplement = invariantRatio.lt(1) ? (0, numbers_1.decimal)(1).sub(invariantRatio) : (0, numbers_1.decimal)(0);
    return (0, numbers_1.fp)((0, numbers_1.fromFp)(fpBptTotalSupply).mul(invariantRatioComplement));
}
exports.calcBptInGivenExactTokensOut = calcBptInGivenExactTokensOut;
function calcTokenOutGivenExactBptIn(tokenIndex, fpBalances, amplificationParameter, fpBptAmountIn, fpBptTotalSupply, fpCurrentInvariant, fpSwapFeePercentage) {
    // Calculate new invariant
    const newInvariant = (0, numbers_1.fromFp)((0, numbers_1.bn)(fpBptTotalSupply).sub(fpBptAmountIn))
        .div((0, numbers_1.fromFp)(fpBptTotalSupply))
        .mul((0, numbers_1.fromFp)(fpCurrentInvariant));
    // First calculate the sum of all token balances which will be used to calculate
    // the current weight of token
    const balances = fpBalances.map(numbers_1.fromFp);
    const sumBalances = balances.reduce((a, b) => a.add(b), (0, numbers_1.decimal)(0));
    // get amountOutBeforeFee
    const newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(balances, amplificationParameter, newInvariant, tokenIndex);
    const amountOutWithoutFee = balances[tokenIndex].sub(newBalanceTokenIndex);
    // We can now compute how much excess balance is being withdrawn as a result of the virtual swaps, which result
    // in swap fees.
    const currentWeight = balances[tokenIndex].div(sumBalances);
    const taxablePercentage = currentWeight.gt(1) ? (0, numbers_1.decimal)(0) : (0, numbers_1.decimal)(1).sub(currentWeight);
    // Swap fees are typically charged on 'token in', but there is no 'token in' here, so we apply it
    // to 'token out'. This results in slightly larger price impact. Fees are rounded up.
    const taxableAmount = amountOutWithoutFee.mul(taxablePercentage);
    const nonTaxableAmount = amountOutWithoutFee.sub(taxableAmount);
    const tokenOut = nonTaxableAmount.add(taxableAmount.mul((0, numbers_1.decimal)(1).sub((0, numbers_1.fromFp)(fpSwapFeePercentage))));
    return (0, numbers_1.fp)(tokenOut);
}
exports.calcTokenOutGivenExactBptIn = calcTokenOutGivenExactBptIn;
function calculateOneTokenSwapFeeAmount(fpBalances, amplificationParameter, lastInvariant, tokenIndex) {
    const balances = fpBalances.map(numbers_1.fromFp);
    const finalBalanceFeeToken = _getTokenBalanceGivenInvariantAndAllOtherBalances(balances, (0, numbers_1.decimal)(amplificationParameter), (0, numbers_1.fromFp)(lastInvariant), tokenIndex);
    if (finalBalanceFeeToken.gt(balances[tokenIndex])) {
        return (0, numbers_1.decimal)(0);
    }
    return (0, numbers_1.toFp)(balances[tokenIndex].sub(finalBalanceFeeToken));
}
exports.calculateOneTokenSwapFeeAmount = calculateOneTokenSwapFeeAmount;
// The amp factor input must be a number: *not* multiplied by the precision
function getTokenBalanceGivenInvariantAndAllOtherBalances(amp, fpBalances, fpInvariant, tokenIndex) {
    const invariant = (0, numbers_1.fromFp)(fpInvariant);
    const balances = fpBalances.map(numbers_1.fromFp);
    return (0, numbers_1.fp)(_getTokenBalanceGivenInvariantAndAllOtherBalances(balances, (0, numbers_1.decimal)(amp), invariant, tokenIndex));
}
exports.getTokenBalanceGivenInvariantAndAllOtherBalances = getTokenBalanceGivenInvariantAndAllOtherBalances;
function _getTokenBalanceGivenInvariantAndAllOtherBalances(balances, amplificationParameter, invariant, tokenIndex) {
    let sum = (0, numbers_1.decimal)(0);
    let mul = (0, numbers_1.decimal)(1);
    const numTokens = balances.length;
    for (let i = 0; i < numTokens; i++) {
        if (i != tokenIndex) {
            sum = sum.add(balances[i]);
            mul = mul.mul(balances[i]);
        }
    }
    // const a = 1;
    amplificationParameter = (0, numbers_1.decimal)(amplificationParameter);
    const b = invariant.div(amplificationParameter.mul(numTokens)).add(sum).sub(invariant);
    const c = invariant
        .pow(numTokens + 1)
        .mul(-1)
        .div(amplificationParameter.mul((0, numbers_1.decimal)(numTokens)
        .pow(numTokens + 1)
        .mul(mul)));
    return b
        .mul(-1)
        .add(b.pow(2).sub(c.mul(4)).squareRoot())
        .div(2);
}
