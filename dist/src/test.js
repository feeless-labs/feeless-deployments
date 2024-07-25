"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForkedNetwork = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
async function default_1(args, hre, run) {
    console.log('Running fork tests...');
    if (args.id) {
        args.testFiles = args.testFiles.filter((file) => file.includes(args.id));
    }
    await run(args);
}
exports.default = default_1;
function getForkedNetwork(hre) {
    const config = hre.network.config;
    if (!config.forking || !config.forking.url)
        throw Error(`No forks found on network ${hre.network.name}`);
    const network = Object.entries(hre.config.networks).find(([, networkConfig]) => {
        var _a;
        const httpNetworkConfig = networkConfig;
        return httpNetworkConfig.url && httpNetworkConfig.url === ((_a = config === null || config === void 0 ? void 0 : config.forking) === null || _a === void 0 ? void 0 : _a.url);
    });
    if (!network)
        throw Error(`No network found matching fork from ${config.forking.url}`);
    return network[0];
}
exports.getForkedNetwork = getForkedNetwork;
