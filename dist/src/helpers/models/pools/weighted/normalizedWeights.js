"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNormalizedWeights = exports.toNormalizedWeights = void 0;
const constants_1 = require("@ethersproject/constants");
// Should match MAX_WEIGHTED_TOKENS from v2-helpers/constants
// Including would introduce a dependency
const MaxWeightedTokens = 100;
/**
 * Normalize an array of token weights to ensure they sum to `1e18`
 * @param weights - an array of token weights to be normalized
 * @returns an equivalent set of normalized weights
 */
function toNormalizedWeights(weights) {
    // When the number is exactly equal to the max, normalizing with common inputs
    // leads to a value < 0.01, which reverts. In this case fill in the weights exactly.
    if (weights.length == MaxWeightedTokens) {
        return Array(MaxWeightedTokens).fill(constants_1.WeiPerEther.div(MaxWeightedTokens));
    }
    const sum = weights.reduce((total, weight) => total.add(weight), constants_1.Zero);
    if (sum.eq(constants_1.WeiPerEther))
        return weights;
    const normalizedWeights = [];
    let normalizedSum = constants_1.Zero;
    for (let index = 0; index < weights.length; index++) {
        if (index < weights.length - 1) {
            normalizedWeights[index] = weights[index].mul(constants_1.WeiPerEther).div(sum);
            normalizedSum = normalizedSum.add(normalizedWeights[index]);
        }
        else {
            normalizedWeights[index] = constants_1.WeiPerEther.sub(normalizedSum);
        }
    }
    return normalizedWeights;
}
exports.toNormalizedWeights = toNormalizedWeights;
/**
 * Check whether a set of weights are normalized
 * @param weights - an array of potentially unnormalized weights
 * @returns a boolean of whether the weights are normalized
 */
const isNormalizedWeights = (weights) => {
    const totalWeight = weights.reduce((total, weight) => total.add(weight), constants_1.Zero);
    return totalWeight.eq(constants_1.WeiPerEther);
};
exports.isNormalizedWeights = isNormalizedWeights;
