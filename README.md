# Minimal Solidity contract testing with Ganache and Jest

A Truffle project is a great way to start a dapp, but sometimes you want something more lightweight. For example, instead of having to pull-off migrations, maybe you just want to compile a simple smart contract and test right-away.

No worries, the Truffle suite of tools has got you covered! Using Ganache, you can easily spawn a test blockchain for your tests.

**Note:** This example uses `solc` to compile the contract. Also uses a Flatenned file.

## How to run it
- start ganache-cli, at least v6.4.1.
- yarn install
- yarn test

## Dependencies

In this example, there are only 3 dependencies!

- `jest` — A testing framework.
- `solc` — Compiles our Solidity contract.
- `web3` — Allows us to interact with our contract and do other Ethereum things.

## Files

These are the files you need to be concerned about.

### `compile.js`

This file houses a utility function that compiles Solidity contracts and spits out JSON we can work with. Do note that we only need two things from the JSON in this example:

1. The contract ABI, and;
2. The contract bytecode.

### `SimpleStorage.sol`

This is a simple Solidity contract that we will use as our example. It allows you to set and get an integer and nothing more.

### `basic.test.js`

This file houses our SimpleStorage tests. Notice that most of the heavy lifting is done in the `beforeAll` hook, where we:

- Compile the contract with `solc`;
- Connection to `ganache-cli`, and;
- Deploy our contract with `web3`.

In the `afterAll` hook, we simply call `stop()` on the Provider to clean up after ourselves.

### `FlattenedERC20.sol`
Solidity contract from Open Zeppelin with ERC20 + ERC20Mintable exposed as IOEToken

### `erc.test.js`
Test the smart contract: 
- minting an account
- transfering tokens
- listen to events: logs, pendingTransactions, newBlockHeaders

## Utils

### Flattering
After install truffle, `npm install -g truffle` you should create an empty project with `truffle init`. then put your contracts with dependencies into a new folder and execute the following steps:
```
npm install -g truffle-flattener
truffle-flattener contracts/ERC20.sol > FlattenedERC20.sol
```
This will create a new `FlattenedERC20.sol` file without import dependencies