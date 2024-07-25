"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectRelativeError = exports.expectLessThanOrEqualWithError = exports.expectArrayEqualWithError = exports.expectEqualWithError = void 0;
const chai_1 = require("chai");
const numbers_1 = require("./numbers");
function expectEqualWithError(actual, expected, error = 0.001) {
    actual = (0, numbers_1.bn)(actual);
    expected = (0, numbers_1.bn)(expected);
    const acceptedError = (0, numbers_1.pct)(expected, error);
    if (actual.gte(0)) {
        (0, chai_1.expect)(actual).to.be.at.least(expected.sub(acceptedError));
        (0, chai_1.expect)(actual).to.be.at.most(expected.add(acceptedError));
    }
    else {
        (0, chai_1.expect)(actual).to.be.at.most(expected.sub(acceptedError));
        (0, chai_1.expect)(actual).to.be.at.least(expected.add(acceptedError));
    }
}
exports.expectEqualWithError = expectEqualWithError;
function expectArrayEqualWithError(actual, expected, error = 0.001) {
    (0, chai_1.expect)(actual.length).to.be.eq(expected.length);
    for (let i = 0; i < actual.length; i++) {
        expectEqualWithError(actual[i], expected[i], error);
    }
}
exports.expectArrayEqualWithError = expectArrayEqualWithError;
function expectLessThanOrEqualWithError(actual, expected, error = 0.001) {
    actual = (0, numbers_1.bn)(actual);
    expected = (0, numbers_1.bn)(expected);
    const minimumValue = expected.sub((0, numbers_1.pct)(expected, error));
    (0, chai_1.expect)(actual).to.be.at.most(expected);
    (0, chai_1.expect)(actual).to.be.at.least(minimumValue);
}
exports.expectLessThanOrEqualWithError = expectLessThanOrEqualWithError;
function expectRelativeError(actual, expected, maxRelativeError) {
    const lessThanOrEqualTo = actual.dividedBy(expected).sub(1).abs().lessThanOrEqualTo(maxRelativeError);
    (0, chai_1.expect)(lessThanOrEqualTo, 'Relative error too big').to.be.true;
}
exports.expectRelativeError = expectRelativeError;
