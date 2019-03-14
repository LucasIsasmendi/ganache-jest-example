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

jest.setTimeout(6100);

const deploySmartContract = async function () {
  // 1. Compile contract artifact
  try {
    const { IOEToken } = await compile("FlattenedERC20.sol");
    accounts = await web3.eth.getAccounts();
    // 3. Create initial contract instance
    const instance = new web3.eth.Contract(IOEToken.abi);

    // 4. Deploy contract and get new deployed instance
    const deployedInstance = await instance
      .deploy({ data: IOEToken.evm.bytecode.object, arguments: ["TEST SMCT", "TST", 9] })
      .send({ from: accounts[0], gas: 2250000 });
    console.log("....4 - create instance smart contract");
    // 5. Assign deployed contract instance to variable
    contractInstance = deployedInstance;

    console.log("....5 - contractInstance Address", contractInstance.options.address);

    await contractInstance.methods.mint(accounts[1], 10000000).send({ from: accounts[0] });
  } catch (error) {
    console.log(error)
  }
}

describe("test ERC20", () => {
  beforeAll(async () => {
    try {
      console.log("Before All")
      web3 = new Web3("http://localhost:8545");
      web3Ws = new Web3("ws://localhost:8545");
      await deploySmartContract();
    } catch (error) {
      console.log("error", error)
    }
  });

  afterAll(async () => {
    // clean up provider
    console.log("After All")
    provider.stop();
  });

  describe("check balance", () => {
    it("should check balance from receiver address", async () => {
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

  describe("watch my ERC20 balance - subscription", () => {
    it("should listen to logs", async () => {
      let callsCounter = 0;
      const logs = web3Ws.eth.subscribe('logs', (error, result) => {
        if (!error) {
          console.log("------- logs ok", result);
        } else {
          console.error("------- logs error", error);
        }
      }).on("data", (log) => {
        ++callsCounter;
        if (callsCounter === 3) {
          console.log("logs", callsCounter, log);
          expect(log.data).toBe('0x00000000000000000000000000000000000000000000000000000000000009c4');
          logs.unsubscribe(function (error, success) {
            if (success)
              console.log('Successfully unsubscribed! 2');
          });
        }
      }).on("changed", (log) => {
        console.log("changed2", log);
      });
      await contractInstance.methods.transfer(accounts[2], 2500).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[3], 2500).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[4], 2500).send({ from: accounts[1] });
    });

    it("should listen to pendingTransactions", async () => {
      console.log("start pendingTransactions")
      const pendingTransactions = web3Ws.eth.subscribe('pendingTransactions', (error, result) => {
        if (!error) {
          console.log("------- pendingTransactions ok", result);
        } else {
          console.error("------- pendingTransactions error", error);
        }
      }).on("data", async (log) => {
        expect(log).not.toBeNull();
        pendingTransactions.unsubscribe(function (error, success) {
          if (success)
            console.log('Successfully unsubscribed! 2');
        });
      });
      await contractInstance.methods.transfer(accounts[2], 2600).send({ from: accounts[1] });
    });
    it("should listen to newBlockHeaders", async () => {
      let callsCounter = 0;
      const latestBlock = await web3.eth.getBlockNumber();
      const newBlockHeaders = web3Ws.eth.subscribe('newBlockHeaders', (error, result) => {
        if (!error) {
          console.log("------- newBlockHeaders ok", result);
        } else {
          console.error("------- newBlockHeaders error", error);
        }
      }).on("data", (log) => {
        ++callsCounter;
        console.log("newBlockHeaders", callsCounter, log);
        if (callsCounter === 3) {
          expect(log.number).toBe(3 + latestBlock);
          newBlockHeaders.unsubscribe(function (error, success) {
            if (success)
              console.log('Successfully unsubscribed! 2');
          });
        }
      });
      await contractInstance.methods.transfer(accounts[2], 2700).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[3], 2700).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[4], 2700).send({ from: accounts[1] });
    });
  });
});
