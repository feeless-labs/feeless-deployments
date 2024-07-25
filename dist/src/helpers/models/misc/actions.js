"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionId = void 0;
const actionId = (instance, method, contractInterface) => {
    const selector = (contractInterface !== null && contractInterface !== void 0 ? contractInterface : instance.interface).getSighash(method);
    return instance.getActionId(selector);
};
exports.actionId = actionId;
