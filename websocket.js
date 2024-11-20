//  use ethers instead of web3 for websocket conection
// More popular
// less restrictive licence
// less ammount of security issues found 
const { ethers } = require('ethers');
const { parseJsonText } = require('typescript');

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

function reconnectProvider(endpoint) {
    console.log('Reconnecting WebSocket provider...');
    setTimeout(() => initializeProvider(), 1000); // Retry after 1 second
  };

function get_websocket_provider( address, opts={} ) {
    const { chain = "eth", rpc='alchemy', topics=[], contractABI = ''} = opts;
    // Replace with your WebSocket provider URL
    const provider = new ethers.WebSocketProvider(ENDPOINTS[chain][rpc]);
    
    // Define the contract address and event filter
    const eventFilter = {
      address, // Optional: Specify the contract address
      topics, // Optional: Specify the event signature
    };
    
    // Subscribe to logs
    provider.on(eventFilter, (log) => {
      console.log('New Log:', log);
    
      // Decode log data if needed
      if (contractABI.length > 0) {
        const parsedLog = ethers.utils.defaultAbiCoder.decode(JSON.parse(contractABI), log.data);
        console.log('Parsed Log:', parsedLog);
      }
    });

    // reconection to handle rpc timeout
    provider.on('close', () => {
        // TODO: implement RPC change logic
        console.log('WebSocket closed. Reconnecting...');
        setTimeout(() => {
          provider = new ethers.providers.WebSocketProvider(ENDPOINTS[chain][rpc]);
        }, 1000);
      });
    
    // Handle connection errors
    provider._websocket.on('error', (err) => {
      console.error('WebSocket Error:', err);
    });

    return provider

}



module.exports = {
    get_websocket_provider
}