const { initializePublicClient,
        initializeWalletClient,
        listenForNewBlocks, 
        listenForContractEventsInBlock,
        callFunction 
      } = require('./websocket') //
const { EVENT_SIGNATURES,
        CONTRACT_ABIS, 
        CONTRACT_ADDRESSES,
        CHAIN_IDS,
        CHAIN_NAMES,
        EXTERNAL_ADDRESSES
      } = require('./contracts') //
const express = require("express");


async function handleMsgReceived(log, event, { data, chain }) {
  // wait for finality as defined per each blockchain to receive payment
  // Pop msg from list of pending msgs
  console.log(`Msg Received on ${data[chain].name}:`, event.eventName, 
              "Msg:", event.args.inboundMessageNumbers,
              "Succcess:", event.args.successfullInbound,
              "Failure Reasons:", event.args.failureReasons
      );
}

async function handleNewMsg(log, event, { chain, publicClients, walletClients }) {  
  console.log(`Msg emmited from ${chain}`, event.eventName, "Msg:", event.args.messageNumber);
  const block = await publicClients[chain].getBlock({ blockNumber: log.blockNumber })
  // set receipts root on destination chain
  await callFunction(
    publicClients[CHAIN_NAMES[event.args.destinationBC]], 
    walletClients[CHAIN_NAMES[event.args.destinationBC]], 
    walletClients[CHAIN_NAMES[event.args.destinationBC]].account,
    CONTRACT_ADDRESSES["verification"][CHAIN_NAMES[event.args.destinationBC]], 
    JSON.parse(CONTRACT_ABIS["verification"][CHAIN_NAMES[event.args.destinationBC]]),
   'setRecTrieRoot',
    [ 
      CHAIN_IDS[chain],
      log.blockNumber,
      block.receiptsRoot 
    ]
  )  
}

async function handleNewBlock(blockNumber, {chain, chains, publicClients, walletClients}) {  
  console.log(`New block on ${chain}: ${blockNumber}`);
  // set blocknumber on destination chains
  for (const destChain of chains){
    if (destChain != chain){
      await callFunction(
        publicClients[destChain], 
        walletClients[destChain], 
        walletClients[destChain].account,
        CONTRACT_ADDRESSES["verification"][destChain], 
        JSON.parse(CONTRACT_ABIS["verification"][destChain]),
       'setLastBlock',
        [ 
          CHAIN_IDS[chain],
          blockNumber       
        ]
      )  
    }
  }

  //[['outgoing', 'OutboundMessage'],  ['incoming', 'InboundMessagesRes']
  await listenForContractEventsInBlock(
    publicClients[chain], 
    CONTRACT_ADDRESSES['outgoing'][chain],
    EVENT_SIGNATURES['OutboundMessage'],
    JSON.parse(CONTRACT_ABIS['outgoing'][chain]), 
    blockNumber,
    handleNewMsg,
    { chain, publicClients, walletClients}
  )
}





// Blockchains that are linstened by the relayer
const blockChains = ['localhost_1', 'localhost_2'] // 'eth' / 'sepolia' / 'bnb' / 'bnbTestnet' / 'localhost_1' / 'localhost_2'
// RPC providers in the order of use
const RPCProviders = ['alchemy', 'infura'] // 'alchemy' / 'infura'

// TODO: handle rpc provider change upon loss of service from current provider
// TODO: synchronize which relayer is relaying the msg before the receive msg event is emitted
async function setup_relayer(express, 
    blockChains = ['eth', 'bnb'],
    newBlockHandlingFunction = handleNewBlock, 
    RPCProviders = ['alchemy', 'infura']
    ) {
  // Initialize Express server
  const app = express();
  const PORT = 3000;
  // public providers
  let publicClients = {}
  // wallet providers
  let walletClients = {}
  // Initialize websocket clients
  for (const chain of blockChains) {
    publicClients[chain] = initializePublicClient({chain, rpc:RPCProviders[0]})
    walletClients[chain] = initializeWalletClient({chain, rpc:RPCProviders[0]})
    await listenForNewBlocks(publicClients[chain], newBlockHandlingFunction, 
      { chains:blockChains, chain, publicClients, walletClients }
    )
  }
  // Optional: Add a health check endpoint
  app.get('/health', (req, res) => {
    res.send({ status: 'Server is running and listening for events' });
  });
  
  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Oracle is running on port ${PORT}`);
    console.log(`Listening to chains:`, blockChains);
  });
  
}
setup_relayer(express, 
              blockChains,
              handleNewBlock,
              RPCProviders
)