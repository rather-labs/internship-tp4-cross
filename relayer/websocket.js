
const { createPublicClient,  parseAbiItem, webSocket, decodeEventLog } = require('viem');
const { mainnet, bsc, bscTestnet, hardhat, sepolia, holesky } = require('viem/chains');

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
function initializeWebSocket(opts){    
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

function initializeWalletClients(privateKey, opts){    
const { chain = 'eth', rpc='alchemy'} = opts;
// Create client
const client = createPublicClient({
    transport: webSocket(ENDPOINTS[chain][rpc]),
    reconnect: {
        attempts: 10, 
        delay: 1_000, // 1 second
    }
})
return (client)
}

// Function to listen for contract events in a specific block
function listenForContractEvents(client, address, event, contractABI, handleNewEvent, data) {
    // Get logs for the contract event
    client.watchEvent({ address, event:parseAbiItem(event),
        onLogs: logs => {
            logs.forEach((log) => {
                // Parse the event log based on your contract ABI
                const decoded = decodeEventLog({
                  abi: contractABI,
                  data: log.data,
                  topics: log.topics,
                });
                handleNewEvent(log, decoded, data)
            })
        }
    })
};
// Function to listen for contract events in a specific block
function listenForContractEventsInBlock(
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
    client.getLogs(eventFilter).then((logs) => {
      logs.forEach((log) => {
        // Parse the event log based on your contract ABI
        const decoded = decodeEventLog({
          abi: contractABI,
          data: log.data,
          topics: log.topics,
        });
        handleNewEvent(log, decoded, data)
      });
    }).catch((error) => {
      console.error('Error fetching logs for block:', error);
    });
};
// Listen for new blocks
function listenForNewBlocks(client, handleBlockNumber, data, opts={}) {
    const { address=null, event='', contractABI = []} = opts;
    client.watchBlockNumber({onBlockNumber: blockNumber => {
      handleBlockNumber(blockNumber, data)
      if (address) {
        listenForContractEventsInBlock(client, address, event, contractABI, blockNumber)
      }
    }
});
};

async function callFunction(publicClient, walletClient, account, 
        address, abi, functionName, args){    
  const { request } = await publicClient.simulateContract({
    address,
    abi,
    functionName,
    args,
    account
  })
  await walletClient.writeContract(request)
}

module.exports = {
    initializeWebSocket,
    listenForNewBlocks,
    listenForContractEventsInBlock,
    listenForContractEvents,
    callFunction
}