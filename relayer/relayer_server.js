const { serializeReceipt, get_proof } = require('./mpt') // 
const { initializeWebSocket,
        listenForNewBlocks, 
        listenForContractEventsInBlock,
        listenForContractEvents 
      } = require('./websocket') //
const { EVENT_SIGNATURES,
        CONTRACT_ABIS, 
        CONTRACT_ADDRESSES,
        CONTRACT_INITIAL_BLOCKS 
      } = require('./contracts') //
const express = require("express");

function sendMsgs(blockNumber, data) {  
  data.incomingMsgs.forEach((msg, index) => {
    if (data.finalityBlocks[index] <= blockNumber) {
      // TODO: send message
      // simulateContract
      // writeContract
    }
  })
}

function handleBlockNumber(blockNumber, data) {  
  data.blockNumber = blockNumber
  console.log(`New block on ${data.name}: ${data.blockNumber}`);
  sendMsgs(blockNumber, data)
}
function handleNewMsg(log, event, data) {  
  console.log(`New Msg on ${data.name}:`, event);
}
function handleUpdateFee(log, event, data) {  
  console.log(`Update fees for msg of ${data.name}:`, event);
}
function handleMsgReceived(log, event, data) {
  // Pop msg from list of pending msgs
  console.log(`Msg Received on ${data.name}:`, event);
}
// Blockchains that are linstened by the relayer
const blockChains = ['bnbTestnet', 'sepolia'] // 'eth' / 'sepolia' / 'bnb' / 'bnbTestnet' / 'hardhat'
// Events that are listened
const events = [] // 'newMsg' / 'updateFee' / 'receiveMsg'
// Functions for event handling,
const eventsHandlingFunctions = [handleNewMsg, handleUpdateFee, handleMsgReceived]
// RPC providers in the order of use
const RPCProviders = ['alchemy', 'infura'] // 'alchemy' / 'infura'

// TODO: handle rpc provider change upon loss of service from current provider
// TODO: synchronize which relayer is relaying the msg before the receive msg event is emitted
function setup_relayer(express, 
    blockChains = ['eth', 'bnb'],
    newBlockHandlingFunction = handleBlockNumber, 
    events = ['newMsg', 'updateFee', 'msgReceived'],
    eventsHandlingFunctions = [handleNewMsg, handleUpdateFee, handleMsgReceived],
    RPCProviders = ['alchemy', 'infura']
    ) {
  // Initialize Express server
  const app = express();
  const PORT = 3000;
  // Websocket providers
  let providers = {}
  // Data per blockchain
  let data = {}
  // Initialize websocket providers
  blockChains.forEach((chain) => {
    providers[chain] = initializeWebSocket({chain, rpc:RPCProviders[0]})
    // Initialize data per blockchain
    data[chain] = {
      name: chain,
      incomingMsgs : [],
      finalityBlocks: [],
      blockNumber : 1
    }
    listenForNewBlocks(providers[chain], newBlockHandlingFunction, data[chain])
  })
  // check events for all blocks since contract deployment
  //events.forEach((event, index) => {
  //  blockChains.forEach((chain) => {
  //    for (let block = CONTRACT_INITIAL_BLOCKS[chain]; block <= data[chain].blockNumber; block++) {
  //      listenForContractEventsInBlock(providers[chain], 
  //        CONTRACT_ADDRESSES[chain], 
  //        EVENT_SIGNATURES[event], 
  //        JSON.parse(CONTRACT_ABIS[chain]),
  //        block, 
  //        eventsHandlingFunctions[index],
  //        data[chain])
  //    }
  //  })
  //})
  // Listen to new events
  events.forEach((event, index) => {
    blockChains.forEach((chain) => {
      listenForContractEvents(providers[chain], 
        CONTRACT_ADDRESSES[chain], 
        EVENT_SIGNATURES[event], 
        JSON.parse(CONTRACT_ABIS[chain]), 
        eventsHandlingFunctions[index],
        data[chain])
    })
  })
  // Optional: Add a health check endpoint
  app.get('/health', (req, res) => {
    res.send({ status: 'Server is running and listening for events' });
  });
  
  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Listening to chains:`, blockChains);
    console.log(`Listening to events:`, events);
  });
  
}
setup_relayer(express, 
              blockChains,
              handleBlockNumber,
              events, 
              eventsHandlingFunctions,
              RPCProviders
)