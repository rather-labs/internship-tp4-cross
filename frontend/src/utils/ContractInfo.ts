import { Hex } from "viem"

// Define move to number mapping
export const gameMoveIndexes: string[] = [
    "Rock",
    "Paper",
    "Scissors",
  ];

export function moveToNumber(move: string): number {
    return (gameMoveIndexes.indexOf(move) + 1);
}
  
// Define number of blocks for finality
export const BLOCKS_FOR_FINALITY = {
    FAST: 1,
    SLOW: 2,
}

// Message information required by relayer per message emmited
export type msgReceipt = {
        status: Hex,
        cumulativeGasUsed: bigint,
        logsBloom: Hex,
        logs: [Hex, Hex[], Hex][],
        txType: Hex,
        rlpEncTxIndex: Hex,
}
export type msgRelayer = {
    blockNumber: number,
    finalityBlock: number,
    txIndex: number,
    fee: number,
    destinationBC: number,
    number: number,
    taxi: boolean,
    receipt: msgReceipt,
    proof: Hex[],
}
// Event Signatures per event - should be blockchain agnostic
export const EVENT_SIGNATURES = {
    OutboundMessage:"event OutboundMessage(bytes,address,address,uint256,uint16,uint256,bool,uint256)",
    UpdateMessageFee:"event UpdateMessageFee(uint256,uint256,uint256)",
    InboundMessagesRes:"event InboundMessagesRes(address,uint256,uint256[],bool[],string[])",
    MoveReceived:"event MoveReceived(uint256,uint256,uint8)",
    GameResult:"event GameResult(uint256,uint256,string,uint256,string,uint8,uint8,uint8,uint16,uint256,uint256)",
}

// Contract ABIS per blockchain 
export const CONTRACT_ABIS = {
    incoming:'[{"inputs":[{"internalType":"uint256[]","name":"_blockChainIds","type":"uint256[]"},{"internalType":"address[]","name":"_blockChainAddresses","type":"address[]"},{"internalType":"address","name":"_verificationAdress","type":"address"}],"stateMutability":"payable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"relayer","type":"address"},{"indexed":false,"internalType":"uint256","name":"sourceBC","type":"uint256"},{"indexed":false,"internalType":"uint256[]","name":"inboundMessageNumbers","type":"uint256[]"},{"indexed":false,"internalType":"bool[]","name":"successfullInbound","type":"bool[]"},{"indexed":false,"internalType":"string[]","name":"failureReasons","type":"string[]"}],"name":"InboundMessagesRes","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"inMsgStatusPerChainIdAndMsgNumber","outputs":[{"internalType":"enumIncomingCommunication.IncomingMsgStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"status","type":"bytes"},{"internalType":"bytes","name":"cumulativeGasUsed","type":"uint256"},{"internalType":"bytes","name":"logsBloom","type":"bytes"},{"components":[{"internalType":"address","name":"txAddress","type":"address"},{"internalType":"bytes[]","name":"topics","type":"bytes[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"structIVerification.Log[]","name":"logs","type":"tuple[]"},{"internalType":"bytes","name":"txType","type":"bytes"},{"internalType":"bytes","name":"rlpEncTxIndex","type":"bytes"}],"internalType":"structIVerification.Receipt[]","name":"_receipts","type":"tuple[]"},{"internalType":"bytes[][]","name":"_proofs","type":"bytes[][]"},{"internalType":"address","name":"_relayer","type":"address"},{"internalType":"uint256","name":"_sourceBC","type":"uint256"},{"internalType":"uint256[]","name":"_sourceBlockNumbers","type":"uint256[]"}],"name":"inboundMessages","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"sourceAddresesPerChainId","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    outgoing:'[{"inputs":[{"internalType":"uint256[]","name":"_blockChainIds","type":"uint256[]"},{"internalType":"address[]","name":"_blockChainAddresses","type":"address[]"},{"internalType":"address","name":"_verificationAdress","type":"address"}],"stateMutability":"payable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"destinationBC","type":"uint256"},{"indexed":false,"internalType":"uint256[]","name":"messageNumbers","type":"uint256[]"}],"name":"MessageDeliveryPaid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"},{"indexed":false,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"destinationBC","type":"uint256"},{"indexed":false,"internalType":"uint16","name":"finalityNBlocks","type":"uint16"},{"indexed":false,"internalType":"uint256","name":"messageNumber","type":"uint256"},{"indexed":false,"internalType":"bool","name":"taxi","type":"bool"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"OutboundMessage","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"destinationBC","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"messageNumber","type":"uint256"}],"name":"UpdateMessageFee","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"destAddresesPerChainId","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"msgFeePerDestChainIdAndNumber","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"outMsgStatusPerChainIdAndMsgNumber","outputs":[{"internalType":"enumOutgoingCommunication.OutgoingMsgStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"outgoingMsgNumberPerDestChain","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"relayer","type":"address"},{"internalType":"uint256","name":"sourceBC","type":"uint256"},{"internalType":"uint256[]","name":"messageNumbers","type":"uint256[]"}],"internalType":"structIVerification.MessagesDelivered","name":"_messagesDelivered","type":"tuple"},{"internalType":"uint256","name":"_destinationBC","type":"uint256"},{"internalType":"uint256","name":"_destinationBlockNumber","type":"uint256"},{"internalType":"address","name":"_destinationEndpoint","type":"address"}],"name":"payRelayer","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"_messageData","type":"bytes"},{"internalType":"address","name":"_receiver","type":"address"},{"internalType":"uint256","name":"_destinationBC","type":"uint256"},{"internalType":"uint16","name":"_finalityNBlocks","type":"uint16"},{"internalType":"bool","name":"_taxi","type":"bool"}],"name":"sendMessage","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_destinationBC","type":"uint256"},{"internalType":"uint256","name":"_messageNumber","type":"uint256"}],"name":"updateMessageFee","outputs":[],"stateMutability":"payable","type":"function"}]',
    verification:'[{"inputs":[{"internalType":"uint256[]","name":"_blockChainIds","type":"uint256[]"},{"internalType":"uint256[]","name":"_blockChainNumber","type":"uint256[]"},{"internalType":"address[][]","name":"_adddresses","type":"address[][]"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"addressesPerChainId","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"allowedOracles","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"allowedRelayers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"blocknumberPerChainId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_sender","type":"address"}],"name":"checkAllowedRelayers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_blockChainNumber","type":"uint256"},{"internalType":"uint256","name":"_blockNumber","type":"uint256"}],"name":"modifyAllowedChains","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_blockChainNumber","type":"uint256"},{"internalType":"address","name":"_address","type":"address"},{"internalType":"bool","name":"_isAllowed","type":"bool"}],"name":"modifyEndPoints","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracleAddress","type":"address"},{"internalType":"bool","name":"_isAllowed","type":"bool"}],"name":"modifyOracleAddresses","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_relayerAddress","type":"address"},{"internalType":"bool","name":"_isAllowed","type":"bool"}],"name":"modifyRelayerAddresses","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"recTrieRootPerChainIdAndBlockNumber","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_blockchain","type":"uint256"},{"internalType":"uint256","name":"_blocknumber","type":"uint256"}],"name":"setLastBlock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_sourceBC","type":"uint256"},{"internalType":"uint256","name":"_blockNumber","type":"uint256"},{"internalType":"bytes32","name":"_reciptTrieRoot","type":"bytes32"}],"name":"setRecTrieRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_blockchain","type":"uint256"},{"internalType":"uint256","name":"_finalityBlock","type":"uint256"}],"name":"verifyFinality","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"status","type":"bytes"},{"internalType":"bytes","name":"cumulativeGasUsed","type":"uint256"},{"internalType":"bytes","name":"logsBloom","type":"bytes"},{"components":[{"internalType":"address","name":"txAddress","type":"address"},{"internalType":"bytes[]","name":"topics","type":"bytes[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"structRlpEncoding.Log[]","name":"logs","type":"tuple[]"},{"internalType":"bytes","name":"txType","type":"bytes"},{"internalType":"bytes","name":"rlpEncTxIndex","type":"bytes"}],"internalType":"structRlpEncoding.Receipt","name":"_receipt","type":"tuple"},{"internalType":"bytes[]","name":"_proof","type":"bytes[]"},{"internalType":"address","name":"_msgAddress","type":"address"},{"internalType":"uint256","name":"_sourceBC","type":"uint256"},{"internalType":"uint256","name":"_sourceBlockNumber","type":"uint256"}],"name":"verifyReceipt","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]',
    game:'[{"inputs":[{"internalType":"address","name":"_outgoingCommunicationContract","type":"address"},{"internalType":"address","name":"_incomingCommunicationContract","type":"address"},{"internalType":"address[]","name":"_gameContractAddresses","type":"address[]"},{"internalType":"uint256[]","name":"_chainIDs","type":"uint256[]"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"nMoves","type":"uint256"},{"internalType":"address","name":"player1","type":"address"},{"internalType":"uint256","name":"player1ChainID","type":"uint256"},{"internalType":"address","name":"player2","type":"address"},{"internalType":"uint256","name":"player2ChainID","type":"uint256"},{"internalType":"bytes32","name":"player1MoveHash","type":"bytes32"},{"internalType":"enumRockPaperScissorsGame.Move","name":"player1Move","type":"uint8"},{"internalType":"enumRockPaperScissorsGame.Move","name":"player2Move","type":"uint8"},{"internalType":"enumRockPaperScissorsGame.Result","name":"result","type":"uint8"},{"internalType":"uint16","name":"blocksForFinality","type":"uint16"},{"internalType":"uint256","name":"player1Bet","type":"uint256"},{"internalType":"uint256","name":"player2Bet","type":"uint256"}],"indexed":false,"internalType":"structRockPaperScissorsGame.Game","name":"finishedGame","type":"tuple"}],"name":"GameResult","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"gameId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"gameSourceChainId","type":"uint256"},{"indexed":false,"internalType":"enumRockPaperScissorsGame.Move","name":"move","type":"uint8"}],"name":"MoveReceived","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"gameContractAddresses","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"gameCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"games","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"nMoves","type":"uint256"},{"internalType":"address","name":"player1","type":"address"},{"internalType":"uint256","name":"player1ChainID","type":"uint256"},{"internalType":"address","name":"player2","type":"address"},{"internalType":"uint256","name":"player2ChainID","type":"uint256"},{"internalType":"bytes32","name":"player1MoveHash","type":"bytes32"},{"internalType":"enumRockPaperScissorsGame.Move","name":"player1Move","type":"uint8"},{"internalType":"enumRockPaperScissorsGame.Move","name":"player2Move","type":"uint8"},{"internalType":"enumRockPaperScissorsGame.Result","name":"result","type":"uint8"},{"internalType":"uint16","name":"blocksForFinality","type":"uint16"},{"internalType":"uint256","name":"player1Bet","type":"uint256"},{"internalType":"uint256","name":"player2Bet","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"incomingCommunicationContract","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"outgoingCommunicationContract","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_gameContractAddress","type":"address"},{"internalType":"uint256","name":"_chainID","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"receiveMsg","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_player2","type":"address"},{"internalType":"uint256","name":"_player2ChainID","type":"uint256"},{"internalType":"bytes32","name":"_moveHash","type":"bytes32"},{"internalType":"uint16","name":"_blocksForFinality","type":"uint16"},{"internalType":"uint256","name":"_player2Bet","type":"uint256"}],"name":"startGame","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_gameId","type":"uint256"},{"internalType":"uint256","name":"_gameSourceChainId","type":"uint256"},{"internalType":"enumRockPaperScissorsGame.Move","name":"_move","type":"uint8"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"submitMove","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_gameId","type":"uint256"},{"internalType":"uint256","name":"_gameSourceChainId","type":"uint256"},{"internalType":"enumRockPaperScissorsGame.Move","name":"_move","type":"uint8"}],"name":"submitMove","outputs":[],"stateMutability":"payable","type":"function"}]'
}

export const SUPPORTED_CHAINS : number[] = [31_339,31_338]
export type SUPPORTED_CHAINS_TYPE = 31_339 | 31_338

export const CHAIN_NAMES = {
    [31_339]: "localhost_1",
    [31_338]: "localhost_2",
}

export const CHAIN_COINGECKO_IDS = {
    [31_339]: "ethereum",
    [31_338]: "binancecoin",
}

export const CHAIN_DECIMALS = {
    [31_339]: 18,
    [31_338]: 18,
}

export const CHAIN_IDS = {
    "localhost_1": 31_339,
    "localhost_2": 31_338,
}

// Communication contract Adresses per blockchain
export const CONTRACT_ADDRESSES = {
    incoming:{
        localhost_1:"0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312",
        localhost_2:"0x8F28B6fF628D11A1f39c550A63D8BF73aD95d1d0",
    },
    outgoing: {
        localhost_1:"0x364C7188028348566E38D762f6095741c49f492B",
        localhost_2:"0x4B5f648644865DB820490B3DEee14de9DF7fFF39",
    },
    verification: {
        localhost_1:"0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9",
        localhost_2:"0x8e590b19CcD16282333c6AF32e77bCb65e98F3c9",
    },
    game: {
        localhost_1:"0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7",
        localhost_2:"0x6F422FcbfF104822D27DC5BFacC5C6FA7c32af77",
    }
}

// External  account adresses per blockchain
export const EXTERNAL_ADDRESSES = {
    localhost_1:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    localhost_2:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
}

// Block for communication contract deployment per blockchain (to search at relayer start)
export const CONTRACT_INITIAL_BLOCKS = {
    localhost_1: 21322558,
    localhost_2: 44551692,
}

