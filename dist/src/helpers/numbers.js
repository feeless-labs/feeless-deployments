"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomFromInterval = exports.scaleDown = exports.scaleUp = exports.printGas = exports.FP_100_PCT = exports.FP_ONE = exports.FP_ZERO = exports.divCeil = exports.fpDiv = exports.fpMul = exports.arraySub = exports.arrayFpMul = exports.arrayAdd = exports.bnSum = exports.min = exports.max = exports.pct = exports.minInt = exports.maxInt = exports.maxUint = exports.negate = exports.bn = exports.fromFp = exports.toFp = exports.fp = exports.decimal = exports.BigNumber = void 0;
const decimal_js_1 = require("decimal.js");
const ethers_1 = require("ethers");
Object.defineProperty(exports, "BigNumber", { enumerable: true, get: function () { return ethers_1.BigNumber; } });
const bn_js_1 = __importDefault(require("bn.js"));
const SCALING_FACTOR = 1e18;
const decimal = (x) => new decimal_js_1.Decimal(x.toString());
exports.decimal = decimal;
const fp = (x) => (0, exports.bn)((0, exports.toFp)(x));
exports.fp = fp;
const toFp = (x) => (0, exports.decimal)(x).mul(SCALING_FACTOR);
exports.toFp = toFp;
const fromFp = (x) => (0, exports.decimal)(x).div(SCALING_FACTOR);
exports.fromFp = fromFp;
const bn = (x) => {
    if (ethers_1.BigNumber.isBigNumber(x))
        return x;
    const stringified = parseScientific(x.toString());
    const integer = stringified.split('.')[0];
    return ethers_1.BigNumber.from(integer);
};
exports.bn = bn;
const negate = (x) => {
    // Ethers does not expose the .notn function from bn.js, so we must use it ourselves
    return (0, exports.bn)(new bn_js_1.default((0, exports.bn)(x).toString()).notn(256).toString());
};
exports.negate = negate;
const maxUint = (e) => (0, exports.bn)(2).pow(e).sub(1);
exports.maxUint = maxUint;
const maxInt = (e) => (0, exports.bn)(2).pow((0, exports.bn)(e).sub(1)).sub(1);
exports.maxInt = maxInt;
const minInt = (e) => (0, exports.bn)(2).pow((0, exports.bn)(e).sub(1)).mul(-1);
exports.minInt = minInt;
const pct = (x, pct) => (0, exports.bn)((0, exports.decimal)(x).mul((0, exports.decimal)(pct)));
exports.pct = pct;
const max = (a, b) => {
    a = (0, exports.bn)(a);
    b = (0, exports.bn)(b);
    return a.gt(b) ? a : b;
};
exports.max = max;
const min = (a, b) => {
    a = (0, exports.bn)(a);
    b = (0, exports.bn)(b);
    return a.lt(b) ? a : b;
};
exports.min = min;
const bnSum = (bnArr) => {
    return (0, exports.bn)(bnArr.reduce((prev, curr) => (0, exports.bn)(prev).add((0, exports.bn)(curr)), 0));
};
exports.bnSum = bnSum;
const arrayAdd = (arrA, arrB) => arrA.map((a, i) => (0, exports.bn)(a).add((0, exports.bn)(arrB[i])));
exports.arrayAdd = arrayAdd;
const arrayFpMul = (arrA, arrB) => arrA.map((a, i) => (0, exports.fpMul)(a, arrB[i]));
exports.arrayFpMul = arrayFpMul;
const arraySub = (arrA, arrB) => arrA.map((a, i) => (0, exports.bn)(a).sub((0, exports.bn)(arrB[i])));
exports.arraySub = arraySub;
const fpMul = (a, b) => (0, exports.bn)(a).mul(b).div(FP_SCALING_FACTOR);
exports.fpMul = fpMul;
const fpDiv = (a, b) => (0, exports.bn)(a).mul(FP_SCALING_FACTOR).div(b);
exports.fpDiv = fpDiv;
const divCeil = (x, y) => 
// ceil(x/y) == (x + y - 1) / y
x.add(y).sub(1).div(y);
exports.divCeil = divCeil;
const FP_SCALING_FACTOR = (0, exports.bn)(SCALING_FACTOR);
exports.FP_ZERO = (0, exports.fp)(0);
exports.FP_ONE = (0, exports.fp)(1);
exports.FP_100_PCT = (0, exports.fp)(1);
function printGas(gas) {
    if (typeof gas !== 'number') {
        gas = gas.toNumber();
    }
    return `${(gas / 1000).toFixed(1)}k`;
}
exports.printGas = printGas;
function scaleUp(n, scalingFactor) {
    if (scalingFactor == (0, exports.bn)(1)) {
        return n;
    }
    return n.mul(scalingFactor);
}
exports.scaleUp = scaleUp;
function scaleDown(n, scalingFactor) {
    if (scalingFactor == (0, exports.bn)(1)) {
        return n;
    }
    return n.div(scalingFactor);
}
exports.scaleDown = scaleDown;
function parseScientific(num) {
    // If the number is not in scientific notation return it as it is
    if (!/\d+\.?\d*e[+-]*\d+/i.test(num))
        return num;
    // Remove the sign
    const numberSign = Math.sign(Number(num));
    num = Math.abs(Number(num)).toString();
    // Parse into coefficient and exponent
    const [coefficient, exponent] = num.toLowerCase().split('e');
    let zeros = Math.abs(Number(exponent));
    const exponentSign = Math.sign(Number(exponent));
    const [integer, decimals] = (coefficient.indexOf('.') != -1 ? coefficient : `${coefficient}.`).split('.');
    if (exponentSign === -1) {
        zeros -= integer.length;
        num =
            zeros < 0
                ? integer.slice(0, zeros) + '.' + integer.slice(zeros) + decimals
                : '0.' + '0'.repeat(zeros) + integer + decimals;
    }
    else {
        if (decimals)
            zeros -= decimals.length;
        num =
            zeros < 0
                ? integer + decimals.slice(0, zeros) + '.' + decimals.slice(zeros)
                : integer + decimals + '0'.repeat(zeros);
    }
    return numberSign < 0 ? '-' + num : num;
}
function randomFromInterval(min, max) {
    // min and max included
    return Math.random() * (max - min) + min;
}
exports.randomFromInterval = randomFromInterval;
