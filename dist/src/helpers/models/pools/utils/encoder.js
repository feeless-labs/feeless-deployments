"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePoolEncoder = exports.BasePoolExitKind = void 0;
const abi_1 = require("@ethersproject/abi");
// RECOVERY_MODE must match BasePoolUserData.RECOVERY_MODE_EXIT_KIND, the value that
// (Legacy)BasePool uses to detect the special exit enabled in recovery mode.
var BasePoolExitKind;
(function (BasePoolExitKind) {
    BasePoolExitKind[BasePoolExitKind["RECOVERY_MODE"] = 255] = "RECOVERY_MODE";
})(BasePoolExitKind = exports.BasePoolExitKind || (exports.BasePoolExitKind = {}));
class BasePoolEncoder {
    /**
     * Cannot be constructed.
     */
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    }
}
exports.BasePoolEncoder = BasePoolEncoder;
/**
 * Encodes the userData parameter for exiting any Pool in recovery mode, by removing tokens in return for
 * an exact amount of BPT
 * @param bptAmountIn - the amount of BPT to be burned
 */
BasePoolEncoder.recoveryModeExit = (bptAmountIn) => abi_1.defaultAbiCoder.encode(['uint256', 'uint256'], [BasePoolExitKind.RECOVERY_MODE, bptAmountIn]);
