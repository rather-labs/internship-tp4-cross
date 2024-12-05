const { serializeReceipt, get_proof } = require('./mpt') // 
const { initializeWebSocket,
        initializeWalletClient,
        listenForNewBlocks, 
        listenForContractEventsInBlock,
        listenForContractEvents,
        callFunction 
      } = require('./websocket') //
const { EVENT_SIGNATURES,
        CONTRACT_ABIS, 
        CONTRACT_ADDRESSES,
        CONTRACT_INITIAL_BLOCKS,
        CHAIN_IDS
      } = require('./contracts') //
const express = require("express");

function sendMsgs(blockNumber, data) {  
  data.incomingMsgs.forEach((msg, index) => {
    if (data.finalityBlocks[index] <= blockNumber) {
      //
    }
  })
}

function handleBlockNumber(blockNumber, data) {  
  data.blockNumber = blockNumber
  console.log(`New block on ${data.name}: ${data.blockNumber}`);
  sendMsgs(blockNumber, data)
}

function handleNewMsg(log, event, data) {  
  const chain = CHAIN_IDS[event.args.destinationBC]
  event.blockNumber = log.blockNumber
  event.address = log.address
  // Inser event ordered by finality block
  const finalityBlock = event.blockNumber+BigInt(event.args.finalityNBlocks)
  const index = data[chain].finalityBlocks.findIndex((x) => x >= finalityBlock);
  if (index === -1) {
    data[chain].incomingMsgs.push(event)
    data[chain].finalityBlocks.push(finalityBlock)
  } else {
    data[chain].incomingMsgs.splice(index, 0, event); 
    data[chain].finalityBlocks.splice(index, 0, finalityBlock); 
  }
}

function handleUpdateFee(log, event, data) {  
  console.log(`Update fees for msg of ${data.name}:`, event);
}

function handleMsgReceived(log, event, data) {
  // wait for finality as defined per each blockchain to receive payment
  // Pop msg from list of pending msgs
  console.log(`Msg Received on ${data.name}:`, event);
}
// Blockchains that are linstened by the relayer
const blockChains = ['localhost_1', 'localhost_2'] // 'eth' / 'sepolia' / 'bnb' / 'bnbTestnet' / 'localhost_1' / 'localhost_2'
// Events that are listened
const events = [['outgoing', 'OutboundMessage'], ['outgoing', 'UpdateMessageFee']] // ['outgoing', 'OutboundMessage'] / ['outgoing', 'UpdateMessageFee'] /  ['incoming', 'InboundMessage']
// Functions for event handling, must be in the same order as events
const eventsHandlingFunctions = [handleNewMsg, handleUpdateFee, handleMsgReceived]
// RPC providers in the order of use
const RPCProviders = ['alchemy', 'infura'] // 'alchemy' / 'infura'

// Websocket providers
let providers = {}

// wallet providers
let walletClient = {}

// TODO: handle rpc provider change upon loss of service from current provider
// TODO: synchronize which relayer is relaying the msg before the receive msg event is emitted
function setup_relayer(express, 
    blockChains = ['eth', 'bnb'],
    newBlockHandlingFunction = handleBlockNumber, 
    events = [['outgoing', 'OutboundMessage'], ['outgoing', 'UpdateMessageFee'], ['incoming', 'InboundMessage']],
    eventsHandlingFunctions = [handleNewMsg, handleUpdateFee, handleMsgReceived],
    RPCProviders = ['alchemy', 'infura']
    ) {
  // Initialize Express server
  const app = express();
  const PORT = 3000;
  // Data per blockchain
  let data = {}
  // Initialize websocket providers
  blockChains.forEach((chain) => {
    providers[chain] = initializeWebSocket({chain, rpc:RPCProviders[0]})
    walletClient[chain] = initializeWalletClient({chain, rpc:RPCProviders[0]})
    // Initialize data per blockchain
    data[chain] = {
      name: chain,
      incomingMsgs : [],
      finalityBlocks: [],
      blockNumber : 1,
    }
    listenForNewBlocks(providers[chain], newBlockHandlingFunction, data[chain])
  })
  // check events for all blocks since contract deployment
  //events.forEach((event, index) => {
  //  blockChains.forEach((chain) => {
  //    for (let block = CONTRACT_INITIAL_BLOCKS[chain]; block <= data[chain].blockNumber; block++) {
  //      listenForContractEventsInBlock(providers[chain], 
  //        CONTRACT_ADDRESSES[event[0]][chain], 
  //        EVENT_SIGNATURES[event[1]], 
  //        JSON.parse(CONTRACT_ABIS[event[0]][chain]),
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
        CONTRACT_ADDRESSES[event[0]][chain], 
        EVENT_SIGNATURES[event[1]], 
        JSON.parse(CONTRACT_ABIS[event[0]][chain]), 
        eventsHandlingFunctions[index],
        data)
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