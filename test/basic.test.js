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

const deploySmartContract = async function () {
  const { SimpleStorage } = await compile("../contracts/SimpleStorage.sol");
  accounts = await web3.eth.getAccounts();

  const instance = new web3.eth.Contract(SimpleStorage.abi);

  const deployedInstance = await instance
    .deploy({ data: SimpleStorage.evm.bytecode.object })
    .send({ from: accounts[0], gas: 150000 });
  contractInstance = deployedInstance;

  console.log("contractInstance Address", contractInstance.options.address)
}

describe("test SimpleStorage", () => {
  beforeAll(async () => {
    web3 = new Web3("http://localhost:8545");
    web3Ws = new Web3("ws://localhost:8545");
  });

  afterAll(async () => {
    provider.stop();
  });

  describe("check web3 subscription before smart contract deployment", () => {
    it("should subscribe to logs after smart contract deploy", async () => {
      const logs = web3Ws.eth.subscribe('logs', (error, result) => {
        if (!error) {
          console.log("[logs] ok");
        } else {
          console.error("[logs] error", error);
        }
      }).on("data", (log) => {
        expect(log.data).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
        logs.unsubscribe(function (error, success) {
          if (success)
            console.log('[logs] Successfully unsubscribed');
        });
      }).on("changed", (log) => {
        console.log("[logs] changed", log);
      });
    });
    it("should deploy smart contract", async () => {
      await deploySmartContract();
    })
  });

  describe("check web3 subscription after smart contract deployment", () => {
    it("should subscribe to logs after smart contract deploy", async () => {
      console.log("should subscribe to log");
      const subscriptionLogs = web3Ws.eth.subscribe('logs', {}, (error, result) => {
        if (!error) {
          console.log("[logs] ok");
        } else {
          console.error("[logs] error", error);
        }
      }).on("data", (log) => {
        expect(log.data).toBe('0x0000000000000000000000000000000000000000000000000000000000000001');
        subscriptionLogs.unsubscribe(function (error, success) {
          if (success)
            console.log('[logs] Successfully unsubscribed');
        });
      }).on("changed", (log) => {
        console.log("[logs] changed", log);
      });
      const oldVal = await contractInstance.methods.get().call();
      await contractInstance.methods.set(1).send({ from: accounts[0] });
      const newVal = await contractInstance.methods.get().call();
      expect(oldVal).toBe("0");
      expect(newVal).toBe("1");
    });
  });

  describe("subscribe and send transaction", () => {
    it("should subscribe to logs", async () => {
      const logs = web3Ws.eth.subscribe('logs', (error, result) => {
        if (!error) {
          console.log("[logs] ok");
        } else {
          console.error("[logs] error", error);
        }
      }).on("data", (log) => {
        console.log("logs -> data", log)
        expect(log.data).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
        logs.unsubscribe(function (error, success) {
          if (success)
            console.log('[logs] Successfully unsubscribed');
        });
      }).on("changed", (log) => {
        console.log("[logs] changed", log);
      });
    });

    it("should send transaction", async () => {
      const rawTransaction = {
        from: '0x93f046e3920b4685f37a3bd8ec7b10dbd11da481',
        to: '0xc8206b07f953ceb81bd455a340cae866dd6d8d56',
        value: web3.utils.toHex(web3.utils.toWei("0.123", "ether")),
        gas: 2200000,
        chainId: 5777
      }

      try {
        const transaction = await web3.eth.accounts.signTransaction(rawTransaction, '0xfa0b239011f90a368fb59166b3871409288ae8a80bee0b4ef5bc749ec51c811f');
        web3.eth.sendSignedTransaction(transaction.rawTransaction);
      } catch (error) {
        // It returns error because needs "web3": "1.0.0-beta.36"
        console.log("[sendSignedTransaction] error", error);
      }
    })
  });
});
