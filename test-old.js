/**
 * @jest-environment node
 */
const Ganache = require("ganache-core");
const Web3 = require("web3");
const compile = require("./compile");

let contractInstance;
let accounts;
let provider;
let web3;
let web3Ws;

const deploySmartContract = async function () {
  // 1. Compile contract artifact
  const { SimpleStorage } = await compile("SimpleStorage.sol");

  // 2. Spawn Ganache test blockchain
  // provider = Ganache.provider();
  // web3 = new Web3(provider);

  accounts = await web3.eth.getAccounts();

  // 3. Create initial contract instance
  const instance = new web3.eth.Contract(SimpleStorage.abi);

  // 4. Deploy contract and get new deployed instance
  const deployedInstance = await instance
    .deploy({ data: SimpleStorage.evm.bytecode.object })
    .send({ from: accounts[0], gas: 150000 });

  // 5. Assign deployed contract instance to variable
  contractInstance = deployedInstance;

  console.log("contractInstance Address", contractInstance.options.address)
}

describe("test stuff", () => {
  beforeAll(async () => {
    console.log("Before All")
    web3 = new Web3("http://localhost:8545");
    web3Ws = new Web3("ws://localhost:8545");
    //await deploySmartContract();
  });

  afterAll(async () => {
    // clean up provider
    console.log("After All")
    provider.stop();
  });
  /*
    describe("check web3", () => {
      it("should subscribe to logs after smart contract deploy", async () => {
        console.log("should subscribe to log");
        const subscriptionLogs = web3Ws.eth.subscribe('logs', {}, (error, result) => {
          if (!error) {
            console.log("------- subscriptionLogs ok", result);
          } else {
            console.error("------- subscriptionLogs error", error);
          }
        }).on("data", (log) => {
          expect(log.data).toBe('0x0000000000000000000000000000000000000000000000000000000000000001');
          subscriptionLogs.unsubscribe(function (error, success) {
            if (success)
              console.log('Successfully unsubscribed!');
          });
        }).on("changed", (log) => {
          console.log("changed", log);
        });
      });
    });
  
    describe("check smart contract", () => {
      it("should test contract", async () => {
        // get old value
        const oldVal = await contractInstance.methods.get().call();
  
        // set new value
        await contractInstance.methods.set(1).send({ from: accounts[0] });
  
        // get new value
        const newVal = await contractInstance.methods.get().call();
  
        // assert our expectations
        expect(oldVal).toBe("0");
        expect(newVal).toBe("1");
        console.log("should test contract ok")
      });
    });*/
  describe("check web3 subscription before smart contract deployment", () => {
    it("should subscribe to logs after smart contract deploy", async () => {
      console.log("should subscribe to log 2");
      const subscriptionLogs = web3Ws.eth.subscribe('logs', (error, result) => {
        if (!error) {
          console.log("------- subscriptionLogs2 ok", result);
        } else {
          console.error("------- subscriptionLogs2 error", error);
        }
      }).on("data", (log) => {
        console.log("data log 2", log)
        expect(log.data).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
        /**
        subscriptionLogs.unsubscribe(function (error, success) {
          if (success)
            console.log('Successfully unsubscribed! 2');
        }); */
      }).on("changed", (log) => {
        console.log("changed2", log);
      });
    });
    it("should deploy smart contract", async () => {
      await deploySmartContract();
    })
  });

  describe("subscribe and send transaction", () => {
    it("should subscribe to logs", async () => {
      console.log("should subscribe to log 2");
      const subscriptionLogs = web3Ws.eth.subscribe('logs', (error, result) => {
        if (!error) {
          console.log("------- subscriptionLogs2 ok", result);
        } else {
          console.error("------- subscriptionLogs2 error", error);
        }
      }).on("data", (log) => {
        console.log("data log 2", log)
        expect(log.data).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
        /**
        subscriptionLogs.unsubscribe(function (error, success) {
          if (success)
            console.log('Successfully unsubscribed! 2');
        }); */
      }).on("changed", (log) => {
        console.log("changed2", log);
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
        console.log("error sending tx", error);
      }
    })
  });
});
