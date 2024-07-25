"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFullyQualifiedNames = exports.findContractSourceName = void 0;
function findContractSourceName(buildInfo, contractName) {
    const names = getAllFullyQualifiedNames(buildInfo);
    const contractMatches = names.filter((name) => name.contractName === contractName);
    if (contractMatches.length === 0)
        throw Error(`Could not find a source file for the requested contract ${contractName}`);
    if (contractMatches.length > 1)
        throw Error(`More than one source file was found to match ${contractName}`);
    return contractMatches[0].sourceName;
}
exports.findContractSourceName = findContractSourceName;
function getAllFullyQualifiedNames(buildInfo) {
    const contracts = buildInfo.output.contracts;
    return Object.keys(contracts).reduce((names, sourceName) => {
        const contractsNames = Object.keys(contracts[sourceName]);
        const qualifiedNames = contractsNames.map((contractName) => ({ sourceName, contractName }));
        return names.concat(qualifiedNames);
    }, []);
}
exports.getAllFullyQualifiedNames = getAllFullyQualifiedNames;
