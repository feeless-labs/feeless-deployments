"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _src_1 = require("@src");
const Vault = new _src_1.Task('20210418-vault', _src_1.TaskMode.READ_ONLY);
const ComposableStablePoolFactoryTask = new _src_1.Task('20220906-composable-stable-pool', _src_1.TaskMode.READ_ONLY);
const ComposableStablePoolFactoryV2Task = new _src_1.Task('20221122-composable-stable-pool-v2', _src_1.TaskMode.READ_ONLY);
const WeightedPoolFactoryTask = new _src_1.Task('20230320-weighted-pool-v4', _src_1.TaskMode.READ_ONLY);
exports.default = {
    Vault,
    iotatestnet: {
        InitialFactories: [
            ComposableStablePoolFactoryV2Task.output({ network: 'iotatestnet' }).ComposableStablePoolFactory,
            WeightedPoolFactoryTask.output({ network: 'iotatestnet' }).WeightedPoolFactory,
        ],
    }
};
