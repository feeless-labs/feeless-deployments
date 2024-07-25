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
const ethers_1 = require("ethers");
const chai_1 = __importStar(require("chai"));
const constants_1 = require("./constants");
const numbers_1 = require("./numbers");
const relativeError_1 = require("./relativeError");
const sharedBeforeEach_1 = require("./sharedBeforeEach");
global.sharedBeforeEach = (nameOrFn, maybeFn) => {
    (0, sharedBeforeEach_1.sharedBeforeEach)(nameOrFn, maybeFn);
};
chai_1.default.use(function (chai, utils) {
    const { Assertion } = chai;
    Assertion.addProperty('zero', function () {
        new Assertion(this._obj).to.be.equal((0, numbers_1.bn)(0));
    });
    Assertion.addProperty('zeros', function () {
        const obj = this._obj;
        const expectedValue = Array(obj.length).fill((0, numbers_1.bn)(0));
        new Assertion(obj).to.be.deep.equal(expectedValue);
    });
    Assertion.addProperty('zeroAddress', function () {
        new Assertion(this._obj).to.be.equal(constants_1.ZERO_ADDRESS);
    });
    Assertion.addMethod('equalFp', function (expectedValue) {
        (0, chai_1.expect)(this._obj).to.be.equal((0, numbers_1.fp)(expectedValue));
    });
    Assertion.addMethod('equalWithError', function (expectedValue, error) {
        if (Array.isArray(expectedValue)) {
            const actual = this._obj;
            actual.forEach((actual, i) => (0, relativeError_1.expectEqualWithError)(actual, expectedValue[i], error));
        }
        else {
            (0, relativeError_1.expectEqualWithError)(this._obj, expectedValue, error);
        }
    });
    Assertion.addMethod('lteWithError', function (expectedValue, error) {
        if (Array.isArray(expectedValue)) {
            const actual = this._obj;
            actual.forEach((actual, i) => (0, relativeError_1.expectLessThanOrEqualWithError)(actual, expectedValue[i], error));
        }
        else {
            (0, relativeError_1.expectLessThanOrEqualWithError)(this._obj, expectedValue, error);
        }
    });
    Assertion.addMethod('almostEqual', function (expectedValue, error) {
        if (Array.isArray(expectedValue)) {
            const actuals = this._obj;
            actuals.forEach((actual, i) => (0, relativeError_1.expectEqualWithError)(actual, expectedValue[i], error));
        }
        else {
            (0, relativeError_1.expectEqualWithError)(this._obj, expectedValue, error);
        }
    });
    Assertion.addMethod('almostEqualFp', function (expectedValue, error) {
        if (Array.isArray(expectedValue)) {
            const actuals = this._obj;
            actuals.forEach((actual, i) => (0, relativeError_1.expectEqualWithError)(actual, (0, numbers_1.fp)(expectedValue[i]), error));
        }
        else {
            (0, relativeError_1.expectEqualWithError)(this._obj, (0, numbers_1.fp)(expectedValue), error);
        }
    });
    ['eq', 'equal', 'equals'].forEach((fn) => {
        Assertion.overwriteMethod(fn, function (_super) {
            return function (expected) {
                const actual = utils.flag(this, 'object');
                if (utils.flag(this, 'deep') &&
                    Array.isArray(actual) &&
                    Array.isArray(expected) &&
                    actual.length === expected.length &&
                    (actual.some(ethers_1.BigNumber.isBigNumber) || expected.some(ethers_1.BigNumber.isBigNumber))) {
                    const equal = actual.every((value, i) => ethers_1.BigNumber.from(value).eq(expected[i]));
                    this.assert(equal, `Expected "[${expected}]" to be deeply equal [${actual}]`, `Expected "[${expected}]" NOT to be deeply equal [${actual}]`, expected, actual);
                }
                else {
                    // eslint-disable-next-line prefer-rest-params
                    _super.apply(this, arguments);
                }
            };
        });
    });
});
