const { serializeReceipt, get_proof } = require('./mpt') // http requests
const { get_websocket_provider } = require('./websocket') // http requests


const express = require("express");
const { ethers } = require("ethers");

// Initialize Express server
const app = express();
const PORT = 3000;

// Initialize Ethers.js provider
const provider = get_websocket_provider(
  process.env.CONTRACT_ADDRESS, 
  {contractABI: process.env.CONTRACT_ABI}
)

// Optional: Add a health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'Server is running and listening for events' });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});