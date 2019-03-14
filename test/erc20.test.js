/**
 * @jest-environment node
 */
const Web3 = require("web3");
const compile = require("../utils/compile");

let contractInstance;
let accounts;
let provider;
let web3;
let web3Ws;

//jest.setTimeout(6100);

const deploySmartContract = async function () {
  const { IOEToken } = await compile("../contracts/FlattenedERC20.sol");
  accounts = await web3.eth.getAccounts();
  const instance = new web3.eth.Contract(IOEToken.abi);
  const deployedInstance = await instance
    .deploy({ data: IOEToken.evm.bytecode.object, arguments: ["TEST SMCT", "TST", 9] })
    .send({ from: accounts[0], gas: 2250000 });
  contractInstance = deployedInstance;
  console.log("contractInstance Address", contractInstance.options.address);
  await contractInstance.methods.mint(accounts[1], 10000000).send({ from: accounts[0] });
}

describe("test IOEToken (ERC20 + mint)", () => {
  beforeAll(async () => {
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
      // transferFrom is triggered by the ccount that receives the money,
      // it requires aproval from the sender
      // https://theethereum.wiki/w/index.php/ERC20_Token_Standard
      await contractInstance.methods.transfer(accounts[2], 25000).send({ from: accounts[1] });
      const balanceAddr2 = await contractInstance.methods.balanceOf(accounts[2]).call();
      expect(balanceAddr2).toEqual("25000");
    });
  });

  describe("watch my ERC20 balance - subscription", () => {
    it("should listen to logs", async () => {
      let callsCounter = 0;
      const logs = web3Ws.eth.subscribe('logs', (error, result) => {
        if (!error) {
          console.log("[logs] ok");
        } else {
          console.error("[logs] error", error);
        }
      }).on("data", (log) => {
        ++callsCounter;
        if (callsCounter === 3) {
          expect(log.data).toBe('0x00000000000000000000000000000000000000000000000000000000000009c4');
          logs.unsubscribe(function (error, success) {
            if (success)
              console.log('[logs] Successfully unsubscribed');
          });
        }
      }).on("changed", (log) => {
        console.log("[logs] changed", log);
      });
      await contractInstance.methods.transfer(accounts[2], 2500).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[3], 2500).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[4], 2500).send({ from: accounts[1] });
    });

    it("should listen to pendingTransactions", async () => {
      const pendingTransactions = web3Ws.eth.subscribe('pendingTransactions', (error, result) => {
        if (!error) {
          console.log("[pendingTransactions] ok");
        } else {
          console.error("[pendingTransactions] error", error);
        }
      }).on("data", async (log) => {
        expect(log).not.toBeNull();
        pendingTransactions.unsubscribe(function (error, success) {
          if (success)
            console.log('[pendingTransactions] Successfully unsubscribed');
        });
      });
      await contractInstance.methods.transfer(accounts[2], 2600).send({ from: accounts[1] });
    });
    it("should listen to newBlockHeaders", async () => {
      let callsCounter = 0;
      const latestBlock = await web3.eth.getBlockNumber();
      const newBlockHeaders = web3Ws.eth.subscribe('newBlockHeaders', (error, result) => {
        if (!error) {
          console.log("[newBlockHeaders] ok");
        } else {
          console.error("[newBlockHeaders] error", error);
        }
      }).on("data", (log) => {
        ++callsCounter;
        if (callsCounter === 3) {
          expect(log.number).toBe(3 + latestBlock);
          newBlockHeaders.unsubscribe(function (error, success) {
            if (success)
              console.log('[newBlockHeaders] Successfully unsubscribed');
          });
        }
      });
      await contractInstance.methods.transfer(accounts[2], 2700).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[3], 2700).send({ from: accounts[1] });
      await contractInstance.methods.transfer(accounts[4], 2700).send({ from: accounts[1] });
    });
  });
});
