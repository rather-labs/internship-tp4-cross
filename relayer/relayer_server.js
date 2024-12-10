const { serializeReceipt, get_proof } = require('./mpt') // 
const { initializePublicClient,
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
        CHAIN_IDS,
        CHAIN_NAMES,
        EXTERNAL_ADDRESSES
      } = require('./contracts') //
const express = require("express");
// Ammount of messages required to fill up bus in the taxi/bus logic (and relay them)
const BUS_CAPACITY = 10 
function sendMsgs(blockNumber, data, publicClients, walletClients) {  
  // FIX: Fee is set to maximum value so as to not reject them, ONLY FOR DEVELOPEMENT
  data.currentFee = Number.MAX_VALUE // TODO: retrieve current data fees from server
  const destinationBCs = []
  const blockNumbers = {}
  const messages = {}
  // TODO: Implement logic to eliminate eternally paused messages due to low fee so as to not allow an inifite 
  // heap growth
  for (let i = 0; i < data.outgoingMsgs.length; i++) { 

    if (data.finalityBlocks[i] > blockNumber) {break;}

    if (data.outgoingMsgs[i].args.fee > data.currentFee) {continue;}

    if (messages[data.outgoingMsgs[i].args.destinationBC] === undefined) {
      destinationBCs.push(data.outgoingMsgs[i].args.destinationBC)
      messages[data.outgoingMsgs[i].args.destinationBC] = []
      blockNumbers[data.outgoingMsgs[i].args.destinationBC] = []
    }

    // TODO: receipt trie inclusion proof?
    if (data.outgoingMsgs[i].args.taxi) {
      messages[data.outgoingMsgs[i].args.destinationBC].push(data.outgoingMsgs[i].args)
      blockNumbers[data.outgoingMsgs[i].args.destinationBC].push(data.outgoingMsgs[i].blockNumber)
    } else {
      data.outgoingMsgsBus[data.outgoingMsgs[i].args.destinationBC].msgs.push(data.outgoingMsgs[i].args)
      data.outgoingMsgsBus[data.outgoingMsgs[i].args.destinationBC].blockNumbers.push(data.outgoingMsgs[i].blockNumber) 
    }
  }

  destinationBCs.forEach(async (destinationBC) => {
    if (data.outgoingMsgsBus[destinationBC].msgs.length >= BUS_CAPACITY){
      messages[destinationBC] = concat(messages[destinationBC], data.outgoingMsgsBus[destinationBC].msgs)
      blockNumbers[destinationBC] = concat(blockNumbers[destinationBC], data.outgoingMsgsBus[destinationBC].blockNumbers)
      data.outgoingMsgsBus[destinationBC] = { msgs:[], blockNumbers:[] }
    }
    await callFunction(
        publicClients[CHAIN_NAMES[destinationBC]], 
        walletClients[CHAIN_NAMES[destinationBC]], 
        walletClients[CHAIN_NAMES[destinationBC]].account,
        CONTRACT_ADDRESSES["incoming"][CHAIN_NAMES[destinationBC]], 
        JSON.parse(CONTRACT_ABIS["incoming"][CHAIN_NAMES[destinationBC]]),
       'inboundMessages',
        [ 
          messages[destinationBC], 
          EXTERNAL_ADDRESSES[data.name], 
          CONTRACT_ADDRESSES["outgoing"][data.name], 
          CHAIN_IDS[data.name], 
          blockNumbers[destinationBC]
        ]
      )  
  })
}

async function handleBlockNumber(blockNumber, data) {  
  data[0].blockNumber = blockNumber
  console.log(`New block on ${data[0].name}: ${data[0].blockNumber}`);
  sendMsgs(blockNumber, data[0], data[1], data[2])
}

function handleNewMsg(log, event, data) {  
  console.log(`Msg emmited from ${data.name}`, event.eventName, "Msg:", event.args.messageNumber);
  event.blockNumber = log.blockNumber
  event.address = log.address
  // Inser event ordered by finality block
  const finalityBlock = event.blockNumber+BigInt(event.args.finalityNBlocks)
  const index = data.finalityBlocks.findIndex((x) => x >= finalityBlock);
  if (index === -1) {
    data.outgoingMsgs.push(event)
    data.finalityBlocks.push(finalityBlock)
  } else {
    data.outgoingMsgs.splice(index, 0, event); 
    data.finalityBlocks.splice(index, 0, finalityBlock); 
  }
}

function handleUpdateFee(log, event, data) {  
  console.log(`Update fees for msg of ${data.name}:`, event.eventName, "Msg:", event.args.messageNumber);
}

function handleMsgReceived(log, event, data) {
  // wait for finality as defined per each blockchain to receive payment
  // Pop msg from list of pending msgs
  console.log(`Msg Received on ${data.name}:`, event.eventName, 
              "Msg:", event.args.inboundMessageNumbers,
              "Succcess:", event.args.successfullInbound,
              "Failure Reasons:", event.args.failureReasons
      );
}
// Blockchains that are linstened by the relayer
const blockChains = ['localhost_1', 'localhost_2'] // 'eth' / 'sepolia' / 'bnb' / 'bnbTestnet' / 'localhost_1' / 'localhost_2'
// Events that are listened
const events = [['outgoing', 'OutboundMessage'], ['outgoing', 'UpdateMessageFee'],  ['incoming', 'InboundMessagesRes']] // ['outgoing', 'OutboundMessage'] / ['outgoing', 'UpdateMessageFee'] /  ['incoming', 'InboundMessage']
// Functions for event handling, must be in the same order as events
const eventsHandlingFunctions = [handleNewMsg, handleUpdateFee, handleMsgReceived]
// RPC providers in the order of use
const RPCProviders = ['alchemy', 'infura'] // 'alchemy' / 'infura'

// TODO: handle rpc provider change upon loss of service from current provider
// TODO: synchronize which relayer is relaying the msg before the receive msg event is emitted
function setup_relayer(express, 
    blockChains = ['eth', 'bnb'],
    newBlockHandlingFunction = handleBlockNumber, 
    events = [['outgoing', 'OutboundMessage'], ['outgoing', 'UpdateMessageFee'], ['incoming', 'InboundMessagesRes']],
    eventsHandlingFunctions = [handleNewMsg, handleUpdateFee, handleMsgReceived],
    RPCProviders = ['alchemy', 'infura']
    ) {
  // Initialize Express server
  const app = express();
  const PORT = 3000;
  // Data per blockchain
  let data = {}
  // public providers
  let publicClients = {}
  // wallet providers
  let walletClients = {}
  // Initialize websocket clients
  blockChains.forEach((chain) => {
    publicClients[chain] = initializePublicClient({chain, rpc:RPCProviders[0]})
    walletClients[chain] = initializeWalletClient({chain, rpc:RPCProviders[0]})
    outgoingMsgsBus = {}  
    blockChains.forEach((chain) => {outgoingMsgsBus[CHAIN_IDS[chain]] = {msgs:[],blockNumbers:[]}})
    // Initialize data per blockchain
    data[chain] = {
      name: chain,
      outgoingMsgs : [],
      outgoingMsgsBus,
      finalityBlocks: [],
      currentFee: 1, 
      blockNumber : 1,
      msgsToClaimPay : [],
    }
    listenForNewBlocks(publicClients[chain], newBlockHandlingFunction, [data[chain], publicClients, walletClients] )
  })
  // check events for all blocks since contract deployment
  //events.forEach((event, index) => {
  //  blockChains.forEach((chain) => {
  //    for (let block = CONTRACT_INITIAL_BLOCKS[chain]; block <= data[chain].blockNumber; block++) {
  //      listenForContractEventsInBlock(publicClients[CHAIN_IDS[chain]], 
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
      listenForContractEvents(publicClients[chain], 
        CONTRACT_ADDRESSES[event[0]][chain], 
        EVENT_SIGNATURES[event[1]], 
        JSON.parse(CONTRACT_ABIS[event[0]][chain]), 
        eventsHandlingFunctions[index],
        data[chain]
      )
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