const { serializeReceipt, get_proof } = require('./mpt') // 
const { initializeWebSocket,
        listenForNewBlocks, 
        listenForContractEvents 
      } = require('./websocket') //


const express = require("express");
const { ethers } = require("ethers");

// Initialize Express server
const app = express();
const PORT = 3000;

// Initialize Ethers.js provider
const provider = initializeWebSocket(
  {
    chain: "eth", 
    rpc:'alchemy'
  }
)

listenForNewBlocks(provider)
listenForContractEvents(provider, 
                        process.env.ETH_CONTRACT_ADDRESS, 
                        process.env.EVENT_SIGNATURE, 
                        JSON.parse(process.env.CONTRACT_ABI))

// Optional: Add a health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'Server is running and listening for events' });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});