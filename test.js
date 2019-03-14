/**
 * @jest-environment node
 */
const Web3 = require("web3");
const compile = require("./compile");

let contractInstance;
let accounts;
let provider;
let web3;
let web3Ws;

const deploySmartContract = async function () {
  // 1. Compile contract artifact
  const { IOEToken } = await compile("FlattenedERC20.sol");
  accounts = await web3.eth.getAccounts();
  // 3. Create initial contract instance
  const instance = new web3.eth.Contract(IOEToken.abi);

  // 4. Deploy contract and get new deployed instance
  const deployedInstance = await instance
    .deploy({ data: IOEToken.evm.bytecode.object, arguments: ["TEST SMCT", "TST", 9] })
    .send({ from: accounts[0], gas: 2250000 });

  // 5. Assign deployed contract instance to variable
  contractInstance = deployedInstance;

  console.log("contractInstance Address", contractInstance.options.address);

  // 6. Load 2 Addresses
}

describe("test ERC20", () => {
  beforeAll(async () => {
    console.log("Before All")
    web3 = new Web3("http://localhost:8545");
    web3Ws = new Web3("ws://localhost:8545");
    await deploySmartContract();
  });

  afterAll(async () => {
    // clean up provider
    console.log("After All")
    provider.stop();
  });

  describe("check balance", () => {
    it("should check balance from receiver address", async () => {
      const balanceAddr1Bef = await contractInstance.methods.balanceOf(accounts[1]).call();
      await contractInstance.methods.mint(accounts[1], 10000000).send({ from: accounts[0] });
      const balanceAddr1Aft = await contractInstance.methods.balanceOf(accounts[1]).call();

      console.log("balance Account 1 : bef/after", balanceAddr1Bef, balanceAddr1Aft);

      const balanceAddr2 = await contractInstance.methods.balanceOf(accounts[2]).call();

      console.log("balances Account 2", balanceAddr2);
      // transferFrom is triggered by the ccount that receives the money,
      // it requires aproval from the sender
      // https://theethereum.wiki/w/index.php/ERC20_Token_Standard
      const load1 = await contractInstance.methods.transfer(accounts[2], 25000).send({ from: accounts[1] });
      const balanceAddr2After = await contractInstance.methods.balanceOf(accounts[2]).call();
      console.log("balances Account 2 after transfer", balanceAddr2After);
      console.log("balance account 1: ", await contractInstance.methods.balanceOf(accounts[1]).call());
      expect(balanceAddr2After).toEqual("25000");
    });
  });
});
