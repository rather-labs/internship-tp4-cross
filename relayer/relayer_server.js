const { getProof, getTrie, serializeReceipt, txTypes, txStatus, verifyProof } = require('./mpt') // 
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
const { toBytes, toHex } = require("viem");
const express = require("express");
const rlp = require('@ethereumjs/rlp')

// Ammount of messages required to fill up bus in the taxi/bus logic (and relay them)
const BUS_CAPACITY = 10 

// Get receipts and proofs formatted for on-chain contract
async function getReceiptsAndProofs(messages, publicClient) {  
  // Get all receipt tries from necesary blocks
  const totalReceipts = {}
  const tries = {}
  for (const msg of messages) {
    if (totalReceipts[msg.blockNumber] == undefined) {
      const block = await publicClient.getBlock({ blockNumber: msg.blockNumber })
      totalReceipts[msg.blockNumber] = []
      for (const txHash of block.transactions)  {
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
        totalReceipts[msg.blockNumber].push(receipt)
      }
      tries[msg.blockNumber] = await getTrie(totalReceipts[msg.blockNumber])
    }
  }
  // Set proof and receipts as expected by contract
  const receipts = []
  const proofs = []
  for (const msg of messages) {
    const receipt = totalReceipts[msg.blockNumber][msg.txIndex]

    const Logs = []
    for (const Log of receipt.logs) {
      const Topics = []
      for (const topic of Log.topics) {
        Topics.push(topic)
      }
      Logs.push([
        Log.address,
        Topics,
        Log.data
      ])
    }
    const proof = await getProof(tries[msg.blockNumber], msg.txIndex)
    if (toHex(await verifyProof(proof, msg.txIndex))
        != toHex(serializeReceipt(receipt))
       ){
        console.log("Inclusion proof not verified for message:", msg.messageNumber)
        continue
    }    
    receipts.push(
      {
        status: txStatus[receipt.status],
        cumulativeGasUsed: toHex(receipt.cumulativeGasUsed),
        logsBloom: receipt.logsBloom,
        logs: Logs,
        txType: txTypes[receipt.type],
        rlpEncTxIndex: toHex(rlp.encode(msg.txIndex)),
      }
    )
    proofs.push(proof.map(value => toHex(value)))
  }
  return [receipts, proofs]
}


async function sendMsgs(blockNumber, data, chain, publicClients, walletClients) {  
  // FIX: Fee is set to maximum value so as to not reject them, ONLY FOR DEVELOPEMENT
  data[chain].currentFee = 0 // TODO: retrieve current data fees from server
  const destinationBCs = []
  const messages = {}
  // TODO: Implement logic to eliminate eternally paused messages due to low
  //  fee so as to not allow an inifite heap growth
  for (let i = 0; i < data[chain].outgoingMsgs.length; i++) { 

    if (data[chain].outgoingMsgs[i].finalityBlocks > blockNumber) {break;}

    if (data[chain].outgoingMsgs[i].fee < data[chain].currentFee) {continue;}

    if (messages[data[chain].outgoingMsgs[i].destinationBC] === undefined) {
      destinationBCs.push(data[chain].outgoingMsgs[i].destinationBC)
      messages[data[chain].outgoingMsgs[i].destinationBC] = []
    }

    if (data[chain].outgoingMsgs[i].taxi) {
      messages[data[chain].outgoingMsgs[i].destinationBC].push(data[chain].outgoingMsgs[i])
    } else {
      data[chain].outgoingMsgsBus[data[chain].outgoingMsgs[i].destinationBC].push(data[chain].outgoingMsgs[i])
    }
  }

  for (const destinationBC of destinationBCs) {
    if (data[chain].outgoingMsgsBus[destinationBC].length >= BUS_CAPACITY){
      messages[destinationBC] = concat(messages[destinationBC], data[chain].outgoingMsgsBus[destinationBC])
    };

    const [receipts, proofs] = await getReceiptsAndProofs(messages[destinationBC], publicClients[chain])
    
    await callFunction(
        publicClients[CHAIN_NAMES[destinationBC]], 
        walletClients[CHAIN_NAMES[destinationBC]], 
        walletClients[CHAIN_NAMES[destinationBC]].account,
        CONTRACT_ADDRESSES["incoming"][CHAIN_NAMES[destinationBC]], 
        JSON.parse(CONTRACT_ABIS["incoming"][CHAIN_NAMES[destinationBC]]),
       'inboundMessages',
        [
          receipts,
          proofs, 
          EXTERNAL_ADDRESSES[data[chain].name],
          CHAIN_IDS[data[chain].name], 
          messages[destinationBC].map(msg => msg.blockNumber)
        ]
    )  
  }
}

async function collectPayment(blockNumber, data, chain, publicClients, walletClients) {
  for( const sourceBC in  data[chain].msgsToClaimPay)  { 
    for( let i = 0; i < data[chain].msgsToClaimPay[sourceBC].length; i++)  { 
      if (data[chain].finalityBlocksPay[sourceBC][i] > blockNumber) {break;}

      await callFunction(
        publicClients[CHAIN_NAMES[destinationBC]], 
        walletClients[CHAIN_NAMES[destinationBC]], 
        walletClients[CHAIN_NAMES[destinationBC]].account,
        CONTRACT_ADDRESSES["outgoing"][CHAIN_NAMES[destinationBC]], 
        JSON.parse(CONTRACT_ABIS["outgoing"][CHAIN_NAMES[destinationBC]]),
       'payRelayer',
        [ 
          data[chain].msgsToClaimPay[sourceBC].args, 
          data[chain].msgsToClaimPay[sourceBC].destinationChain, 
          data[chain].msgsToClaimPay[sourceBC].blockNumber, 
          data[chain].msgsToClaimPay[sourceBC].address
        ]
      );  
      //function payRelayer(
      //  IVerification.MessagesDelivered calldata _messagesDelivered,
      //  uint256 _destinationBC,
      //  uint256 _destinationBlockNumber,
      //  address _destinationEndpoint
      //)   
    }
  }
}


async function handleBlockNumber(blockNumber, {data, chain, publicClients, walletClients}) {  
  data[chain].blockNumber = blockNumber
  console.log(`New block on ${data[chain].name}: ${data[chain].blockNumber}`);
  await sendMsgs(blockNumber, data, chain, publicClients, walletClients)
  await collectPayment(blockNumber, data, chain, publicClients, walletClients)
}

async function handleNewMsg(log, event, { data, chain }) {  
  console.log(`Msg emmited from ${data[chain].name}`, event.eventName, "Msg:", event.args.messageNumber);
  const outMsg = {
    blockNumber: log.blockNumber,
    finalityBlock: log.blockNumber+BigInt(event.args.finalityNBlocks),
    txIndex: log.transactionIndex,
    fee: event.args.fee,
    destinationBC: event.args.destinationBC,
    number: event.args.messageNumber,
    taxi: event.args.taxi,
  }
  // Insert event ordered by finality block
  const index = data[chain].outgoingMsgs.findIndex((x) => x.finalityBlock >= outMsg.finalityBlock);
  if (index === -1) {
    data[chain].outgoingMsgs.push(outMsg)
  } else {
    data[chain].outgoingMsgs.splice(index, 0, outMsg); 
  }
}

function handleUpdateFee(log, event, { data, chain }) {  
  console.log(`Update fees for msg of ${data[chain].name}:`, event.eventName, "Msg:", event.args.messageNumber);
}

function handleMsgReceived(log, event, { data, chain }) {
  // wait for finality as defined per each blockchain to receive payment
  // Pop msg from list of pending msgs
  console.log(`Msg Received on ${chain}:`, event.eventName, 
              "Msgs:", event.args.inboundMessageNumbers,
              "Succcess:", event.args.successfullInbound,
              "Failure Reasons:", event.args.failureReasons
      );
  event.destinationChain = CHAIN_IDS[chain] 
  event.blockNumber = log.blockNumber
  for (let i = 0; i < event.args.inboundMessageNumbers.length; i++) { 
    // Remove from outgoing messages if inbound was succesfull
    if (event.args.successfullInbound[i]) {
      const index = data[CHAIN_NAMES[event.args.sourceBC]].outgoingMsgs.findIndex( 
        msg => msg.number == event.args.inboundMessageNumbers[i] 
                && msg.destinationBC == CHAIN_IDS[chain]
                
      );
      if (index >= 0) {
        console.log("outgoingMsgs remove:", index)
        data[CHAIN_NAMES[event.args.sourceBC]].outgoingMsgs.splice(index, 1)
      } else {
        // Remove from Bus messages
        const index = data[CHAIN_NAMES[event.args.sourceBC]].outgoingMsgsBus[event.destinationChain].findIndex( 
          msg => msg.number == event.args.inboundMessageNumbers[i] 
                  && msg.destinationBC == CHAIN_IDS[chain]
                  
        );
        if (index >= 0) {
          console.log("outgoingMsgsBus remove:", index)
          data[CHAIN_NAMES[event.args.sourceBC]].outgoingMsgsBus[event.destinationChain].splice(index, 1)
        } 
      }
    } 
    if (event.args.relayer == EXTERNAL_ADDRESSES[CHAIN_NAMES[event.args.sourceBC]]) {
      data[CHAIN_NAMES[event.args.sourceBC]].msgsToClaimPay.push(event)
    }    
  }
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
  const PORT = 3001;
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
    blockChains.forEach((chain) => {outgoingMsgsBus[CHAIN_IDS[chain]] = []})
    // Initialize data per blockchain
    data[chain] = {
      name: chain,
      outgoingMsgs : [],
      outgoingMsgsBus,
      currentFee: 1, 
      blockNumber : 1,
      msgsToClaimPay : [],
    }
    listenForNewBlocks(publicClients[chain], newBlockHandlingFunction, { data, chain, publicClients, walletClients })
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
  //        { data, chain, publicClients, walletClients })
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
        { data, chain, publicClients, walletClients }
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