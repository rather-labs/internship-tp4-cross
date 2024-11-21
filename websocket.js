
const { createPublicClient,  parseAbiItem, webSocket, decodeEventLog  } = require('viem');

const ENDPOINTS = {
    "eth": {
        'infura' :'wss://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
        'alchemy':'wss://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_PROJECT_ID,
    },
    "bnb":  {
        'infura' :'wss://stream.binance.com:9443/ws/',
        'alchemy':'wss://stream.binance.com:9443/ws/',

    },
    "bnc":  {
        'infura' :'wss://stream.binance.com:9443/ws/',
        'alchemy':'wss://stream.binance.com:9443/ws/',
    },
}

// Function to listen for contract events in a specific block
function listenForContractEvents(client, address, event, contractABI) {
    // Get logs for the contract event
    client.watchEvent({ address, event:parseAbiItem(event),
        onLogs: logs => {
            logs.forEach((log) => {
                console.log('Event Log - TxHash:', log.transactionHash);
                // Parse the event log based on your contract ABI
                const decoded = decodeEventLog({
                  abi: contractABI,
                  data: log.data,
                  topics: log.topics,
                });
                //console.log('Parsed Event:', decoded);
            })
        }
    })
};
// Function to listen for contract events in a specific block
function listenForContractEventsInBlock(client, address, event, contractABI, blockNumber) {
    // Define your event filter (e.g., ExampleEvent)
    const eventFilter = {
      address,
      event:parseAbiItem(event),
      block: blockNumber, // Listen for events in this block
    };

    // Get logs for the contract event
    client.getLogs(eventFilter).then((logs) => {
      logs.forEach((log) => {
        console.log('Event Log in Block - TxHash:', log.transactionHash)
        // Parse the event log based on your contract ABI
        const decoded = decodeEventLog({
          abi: contractABI,
          data: log.data,
          topics: log.topics,
        });
        //console.log('Parsed Event in Block:', decoded);
      });
    }).catch((error) => {
      console.error('Error fetching logs for block:', error);
    });
};
// Listen for new blocks
function listenForNewBlocks(client, opts={}) {
    const { address=null, event='', contractABI = []} = opts;
    client.watchBlockNumber({onBlockNumber: blockNumber => {
      console.log(`New block: ${blockNumber}`);
      if (address) {
        listenForContractEventsInBlock(client, address, event, contractABI, blockNumber)
      }
    }
});
};

// Initialize the Viem WebSocket client 
// Listens to event and gets block number
function initializeWebSocket(opts){    
    const { chain = "eth", rpc='alchemy'} = opts;
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


module.exports = {
    initializeWebSocket,
    listenForNewBlocks,
    listenForContractEvents
}