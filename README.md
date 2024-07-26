# <img src="logo.svg" alt="Feeless" height="128px">

# Feeless V2 Deployments

[![NPM Package](https://img.shields.io/npm/v/@feeless-labs/v1-deployments.svg)](https://www.npmjs.org/package/@feeless-labs/v1-deployments)
[![GitHub Repository](https://img.shields.io/badge/github-deployments-lightgrey?logo=github)](https://github.com/feeless-labs/feeless-v1-monorepo/tree/master/pkg/deployments)

This package contains the addresses and ABIs of all Feeless V2 deployed contracts for IOTA EVM. Each deployment consists of a deployment script (called 'task'), inputs (script configuration, such as dependencies), outputs (typically contract addresses), ABIs and bytecode files of related contracts.

Addresses and ABIs can be consumed from the package in JavaScript environments, or manually retrieved from the [GitHub](https://github.com/feeless-labs/feeless-v1-monorepo/tree/master/pkg/deployments) repository.

Note that some protocol contracts are created dynamically: for example, `WeightedPool` contracts are deployed by the canonical `WeightedPoolFactory`. While the ABIs of these contracts are stored in the `abi` directory of each deployment, their addresses are not. Those can be retrieved by querying the on-chain state or processing emitted events.

## Overview

### Deploying Contracts

For more information on how to create new deployments or run existing ones in new networks, head to the deployment guide.

### Installation

$ npm install @feeless-labs/v2-deployments

### Usage

Import `@feeless-labs/v2-deployments` to access the different ABIs and deployed addresses. To see all current Task IDs and their associated contracts, head to Active Deployments.

Past deployments that are currently not in use or have been superseded can be accessed in the Deprecated Deployments section. Use `deprecated/` as prefix when referring to a deprecated task ID.

> ⚠️ Exercise care when interacting with deprecated deployments: there's often a very good reason why they're no longer active.
>
> You can find information on why each deployment has been deprecated in their corresponding readme file.

- **async function getFeelessContract(taskID, contract, network)**

Returns an [Ethers](https://docs.ethers.io/v5/) contract object for a canonical deployment (e.g. the Vault, or a Pool factory).

_Note: requires using [Hardhat](https://hardhat.org/) with the [`hardhat-ethers`](https://hardhat.org/plugins/nomicfoundation-hardhat-ethers.html) plugin._

- **async function getFeelessContractAt(taskID, contract, address)**

Returns an [Ethers](https://docs.ethers.io/v5/) contract object for a contract dynamically created at a known address (e.g. a Pool created from a factory).

_Note: requires using [Hardhat](https://hardhat.org/) with the [`hardhat-ethers`](https://hardhat.org/plugins/nomicfoundation-hardhat-ethers.html) plugin._

- **function getFeelessContractAbi(taskID, contract)**

Returns a contract's [ABI](https://docs.soliditylang.org/en/latest/abi-spec.html).

- **function getFeelessContractBytecode(taskID, contract)**

Returns a contract's [creation code](https://docs.soliditylang.org/en/latest/contracts.html#creating-contracts).

- **function getFeelessContractAddress(taskID, contract, network)**

Returns the address of a contract's canonical deployment.

- **function getFeelessDeployment(taskID, network)**

Returns an object with all contracts from a deployment and their addresses.

## Active Deployments

| Description                                | Contract Address / Pool ID                                   |
| ------------------------------------------ | -------------------------------------------------- |
| Authorizer                                 | 0xA331D84eC860Bf466b4CdCcFb4aC09a1B43F3aE6         |
| Authorizer Adaptor                         | 0x820cFb05755D3316556Ef4F1049CF07e0b102DcC         |
| Authorizer Adaptor Entrypoint              | 0x932257e6D5927f64DbF96d2C2CA5D1c47abc7d6e         |
| Authorizer With Adaptor Validation         | 0x3fA7Bd2622bCb69d53b15c667Ffac8c8972050C8         |
| Balancer Helpers                           | 0x70213c0F6e0f358C32c63ea902048c278e9632Bb         |
| Balancer Queries                           | 0x2d43E17168383299183eA66a530FE378F1537b01         |
| Balancer Relayer                           | 0x598ce0f1ab64B27256759ef99d883EE51138b9bd         |
| Batch Relayer Library                      | 0xD87F44Df0159DC78029AB9CA7D7e57E7249F5ACD         |
| Circuit Breaker Lib                        | 0xDF9B5B00Ef9bca66e9902Bd813dB14e4343Be025         |
| Composable Stable Pool Factory             | 0x880843314b08750963120A1A92028729b17bEa9f         |
| Double Entrypoint Fix Relayer              | 0x8E5698dC4897DC12243c8642e77B4f21349Db97C         |
| External Weighted Math                     | 0x03F3Fb107e74F2EAC9358862E91ad3c692712054         |
| L2 Balancer Pseudo Minter                  | 0xD3e63cA183a7F207869186501ec880A15db9043c         |
| L2 Layer Zero Bridge Forwarder             | 0x12Ca9De662A7Bf5Dc89e034a5083eF751B08EDe7         |
| Managed Pool Add Remove Token Lib          | 0x5c47b5c4EF4606268c51985d44b41c612ADFA12b         |
| Managed Pool Amm Lib                       | 0xEb904cB3854F9E98Fd6fd487693D2d3613788A7F         |
| Managed Pool Factory                       | 0x88d87fdA64837aB6323f48ce898a0648dc29789f         |
| No Protocol Fee Liquidity Bootstrapping Pool Factory | 0xd0ca61fe288B591A9E70fC5058297d39Cc3bE458 |
| Null Voting Escrow                         | 0x3b730976728Cf14E2bD95416ac79f8d83fb3AE4A         |
| Pool Recovery Helper                       | 0x60AcB1aE821fC8F63EACe810Bf7C14C05EAdF76B         |
| Protocol Fee Percentages Provider          | 0x101a83d167a907ae8Ea8EFaC48B2B8269FACB4EF         |
| Protocol Fees Collector                    | 0xce88686553686DA562CE7Cea497CE749DA109f9F         |
| Protocol Fees Withdrawer                   | 0x9fe5997cfB84957b7Ff2c330E826959609D98357         |
| Protocol Id Registry                       | 0x5cF4928a3205728bd12830E1840F7DB85c62a4B9         |
| Query Processor                            | 0x6783995f91A3D7f7C24B523669488F96cCa88d31         |
| Recovery Mode Helper                       | 0x682f0dDBFd41D1272982f64a499Fb62d80e27589         |
| Rewards Only Gauge                         | 0x41B953164995c11C81DA73D212ED8Af25741b7Ac         |
| Vault                                      | 0x4d25b0729901DD546cb5c042c8D63B792960DE4D         |
| Voting Escrow Delegation Proxy             | 0xCbE2d6510ff1E16E658FABF68C3Da80C31A79cf1         |
| Weighted Pool 2 Tokens Factory             | 0xCF0a32Bbef8F064969F21f7e02328FB577382018         |
| Weighted Pool Factory                      | 0x14C4F1e47793e60b25083bc7d3a88B08cF7774E3         |
| FLS IOTA-A Weighted Pool                   | 0x0c3861100485C118f63e50D615E75daD491e19c2         |
| FLS IOTA-A Weighted Pool ID                | 0x0c3861100485c118f63e50d615e75dad491e19c200020000000000000000000a |
| ETH BTC Weighted Pool                      | 0xff8E14b5a4be62434c7759d339A6E7C4A586aB31         |
| ETH BTC Weighted Pool ID                   | 0xff8e14b5a4be62434c7759d339a6e7c4a586ab31000200000000000000000004 |
| FLS DAI Weighted Pool                      | 0x6b2B40c5C0d9D9Cd4B82f05E756A4e513faA7e2f         |
| FLS DAI Weighted Pool ID                   | 0x6b2b40c5c0d9d9cd4b82f05e756a4e513faa7e2f000200000000000000000005 |
| IOTA BTC Weighted Pool                     | 0x230fbC50A0db76F3f9E85e20907e1Fe4E9B387d7         |
| IOTA BTC Weighted Pool ID                  | 0x230fbc50a0db76f3f9e85e20907e1fe4e9b387d7000200000000000000000006 |
| IOTA ETH Weighted Pool                     | 0x567f9830e839e40E6D83e6aeedC4AeB433aA6B96         |
| IOTA ETH Weighted Pool ID                  | 0x567f9830e839e40e6d83e6aeedc4aeb433aa6b96000200000000000000000007 |
| FLS Liquidity Bootstrapping Pool           | 0x9231737db8c9F43db7B5C007211C714eFde54CBA         |
| FLS Liquidity Bootstrapping Pool ID        | 0x9231737db8c9f43db7b5c007211c714efde54cba00020000000000000000000b |
| USDC DAI Composable Stable Pool            | 0x696466e31293DC94362f0ADBfDDa043Dd5f3896b         |
| USDC DAI Composable Stable Pool ID         | 0x696466e31293dc94362f0adbfdda043dd5f3896b000000000000000000000009 |
| USDT USDC Composable Stable Pool           | 0x1dD3158AE7E459108710B736ad61154a1c65EB0e         |
| USDT USDC Composable Stable Pool ID        | 0x1dd3158ae7e459108710b736ad61154a1c65eb0e000000000000000000000008 |

