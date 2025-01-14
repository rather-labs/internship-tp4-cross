
const { createPublicClient, 
        createWalletClient, 
        parseAbiItem, 
        webSocket, 
        decodeEventLog 
      } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { mainnet, bsc, bscTestnet, hardhat, sepolia, holesky } = require('viem/chains');
const { parseEther } = require('viem');


// create a WebSocket transport for developement using local hardhat chain
const ENDPOINTS = {
    eth: {
        infura  : 'wss://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
        alchemy : 'wss://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_PROJECT_ID,
        chain   : mainnet
    },
    sepolia:  {
        infura  : '',
        alchemy : 'wss://eth-sepolia.g.alchemy.com/v2/'+ process.env.ALCHEMY_PROJECT_ID,
        chain   : sepolia
    },
    holesky:  {
        infura  : '',
        alchemy : '', // holesky in alchemy doesn't allow websocket
        chain   : holesky
    },
    bnb:  {
        infura  : 'wss://stream.binance.com:9443/ws/',
        alchemy : 'wss://bnb-mainnet.g.alchemy.com/v2'+ process.env.ALCHEMY_PROJECT_ID,
        chain   : bsc
    },
    bnbTestnet:  {
        infura  : '',
        alchemy : 'wss://bnb-testnet.g.alchemy.com/v2/'+ process.env.ALCHEMY_PROJECT_ID,
        chain   : bscTestnet
    },
    localhost_1:  {
        infura  : process.env.WS_URL_1,
        alchemy : process.env.WS_URL_1,
        chain   : hardhat // also can use localhost
    },
    localhost_2:  {
        infura  : process.env.WS_URL_2,
        alchemy : process.env.WS_URL_2,
        chain   : hardhat // also can use localhost
    },
}

// Initialize the Viem WebSocket client 
// Listens to event and gets block number
function initializePublicClient(opts){    
  const { chain = 'eth', rpc='alchemy'} = opts;
  // Create client
  const client = createPublicClient({
      chain:ENDPOINTS[chain]['chain'],
      transport: webSocket(ENDPOINTS[chain][rpc]),
      reconnect: {
          attempts: 10, 
          delay: 1_000, // 1 second
      }
  })
  return (client)
}

const PRIVATE_KEYS = JSON.parse(process.env.PRIVATE_KEYS)

function initializeWalletClient(opts){    
  const { chain = 'eth', rpc='alchemy'} = opts;
  // Create client
  const client = createWalletClient({  
      account: privateKeyToAccount(PRIVATE_KEYS[chain]),
      transport: webSocket(ENDPOINTS[chain][rpc]),
      reconnect: {
          attempts: 10, 
          delay: 1_000, // 1 second
      }
  })
  return (client)
}

async function callFunction(
  publicClient, 
  walletClient, 
  account, 
  address, 
  abi, 
  functionName, 
  args,
  overrides={},
  maxAttempts = 5 // Number of attempts
){    
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      attempt++;
      const feeData = await publicClient.estimateFeesPerGas();
      const { request } = await publicClient.simulateContract({
        address,
        abi,
        functionName,
        args,
        account,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        overrides
      })
      await walletClient.writeContract(request)
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
         console.error('Transaction failed after ${maxAttempts} attempts:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Waits for 0.5 seconds before retry
    }
  }  
}

// Function to listen for contract events in a specific block
async function listenForContractEvents(client, address, event, contractABI, handleNewEvent, data) {
    // Get logs for the contract event
    await client.watchEvent({ address, event:parseAbiItem(event),
        onLogs: async logs => {
            for (const log of logs) {
              try {
                // Parse the event log based on your contract ABI
                const decoded = decodeEventLog({
                  abi: contractABI,
                  data: log.data,
                  topics: log.topics,
                });
                await handleNewEvent(log, decoded, data)
              } catch (error) {
                console.error("Error decoding or handling event:", error);
              }
            }
        }
    })
};
// Function to listen for contract events in a specific block
async function listenForContractEventsInBlock(
            client, address, event, contractABI, 
            blockNumber, 
            handleNewEvent, data) {
    // Define your event filter (e.g., ExampleEvent)
    const eventFilter = {
      address,
      event:parseAbiItem(event),
      block: blockNumber, // Listen for events in this block
    };

    // Get logs for the contract event
    await client.getLogs(eventFilter)
    .then(async (logs) => {
      // Create an array of promises to handle logs concurrently
      const logPromises = logs.map(async (log) => {
        try {
          // Decode the event log based on your contract ABI
          const decoded = decodeEventLog({
            abi: contractABI,
            data: log.data,
            topics: log.topics,
          });
  
          // Process the log asynchronously
          await handleNewEvent(log, decoded, data);
        } catch (error) {
          console.error('Error processing log:', error);
        }
      });
  
      // Wait for all logs to be processed concurrently
      await Promise.all(logPromises);
    })
    .catch((error) => {
      console.error('Error fetching logs:', error);
    });
};

// Listen for new blocks
async function listenForNewBlocks(client, handleBlockNumber, data) {
    await client.watchBlockNumber({onBlockNumber: async blockNumber => {
      await handleBlockNumber(blockNumber, data)
    }
});
};

module.exports = {
    initializePublicClient,
    listenForNewBlocks,
    listenForContractEventsInBlock,
    listenForContractEvents,
    callFunction,
    initializeWalletClient
}