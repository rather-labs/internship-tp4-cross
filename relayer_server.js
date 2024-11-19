const rlp = require('@ethereumjs/rlp')
const { serializeReceipt, get_proof } = require('./mpt')

const express = require("express");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
const PORT = 3000;
// Load environment variables
const PROVIDER_URL = process.env.PROVIDER_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = JSON.parse(process.env.CONTRACT_ABI);

// Set up Ethereum provider
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

// Initialize the contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Middleware to parse JSON
app.use(express.json());

// API endpoint to check server status
app.get("/", (req, res) => {
  res.send("Blockchain event listener is running...");
});

// Listen for events
contract.on("YourEventName", (...args) => {
  const eventDetails = args[args.length - 1]; // Last argument is the event metadata
  console.log("Event detected:", eventDetails);
  console.log("Arguments:", args);

  // Example: Perform a task when an event is detected
  // You can save the event details to a database or trigger further actions.
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log("Listening for blockchain events...");
});