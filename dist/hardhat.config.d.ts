import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-vyper';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-local-networks-config-plugin';
import 'hardhat-ignore-warnings';
import 'tsconfig-paths/register';
import './src/helpers/setupTests';
declare const _default: {
    mocha: {
        timeout: number;
    };
    solidity: {
        version: string;
        settings: {
            optimizer: {
                enabled: boolean;
                runs: number;
            };
        };
    };
    vyper: {
        compilers: {
            version: string;
        }[];
    };
    paths: {
        artifacts: string;
        cache: string;
        sources: string;
    };
    warnings: {
        '*': {
            'shadowing-opcode': string;
            default: string;
        };
    };
    etherscan: {
        customChains: {
            network: string;
            chainId: number;
            urls: {
                apiURL: string;
                browserURL: string;
            };
        }[];
    };
};
export default _default;
