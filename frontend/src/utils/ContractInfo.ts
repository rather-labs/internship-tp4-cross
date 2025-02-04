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
    MoveReceived:"event MoveReceived(uint256,uint256,bytes32,uint8)",
    GameResult:"event GameResult(uint256,uint256,string,uint256,string,uint8,uint8,uint8,uint16,uint256,uint256)",
}

// Import ABIs from JSON files
import incomingAbi from '../lib/abis/IncomingCommunication.json'
import outgoingAbi from '../lib/abis/OutgoingCommunication.json'
import verificationAbi from '../lib/abis/Verification.json'
import gameAbi from '../lib/abis/Game.json'



// Contract ABIS per blockchain 
export const CONTRACT_ABIS = {
    incoming: incomingAbi.abi,
    outgoing: outgoingAbi.abi,
    verification: verificationAbi.abi,
    game: gameAbi.abi
}

export const SUPPORTED_CHAINS : number[] = [ 17_000, 97, 31_339, 31_338 ]
export type SUPPORTED_CHAINS_TYPE = 17_000 | 97 | 31_339 | 31_338

export const CHAIN_NAMES = {
    [31_339]: "localhost_1",
    [31_338]: "localhost_2",
    [17_000]: "holesky",
    [97]: "bsc_testnet",
}


export const CHAIN_COINGECKO_IDS = {
    [31_339]: "ethereum",
    [31_338]: "binancecoin",
    [17_000]: "ethereum",
    [97]: "binancecoin",
}


export const CHAIN_DECIMALS = {
    [31_339]: 18,
    [31_338]: 18,
    [17_000]: 18,
    [97]: 18,
}

export const CHAIN_IDS = {
    localhost_1: 31_339,
    localhost_2: 31_338,
    holesky: 17_000,
    bsc_testnet: 97,
}


// Communication contract Adresses per blockchain
export const CONTRACT_ADDRESSES = {
    incoming:{
        localhost_1:"0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312",
        localhost_2:"0x8F28B6fF628D11A1f39c550A63D8BF73aD95d1d0",
        holesky: "0xB4269672ed8412e05470D3317DB855eF6e88cece",
        bsc_testnet: "0x033F7B78100d8DdA76854e8B1912a38054601124",
    },

    outgoing: {
        localhost_1:"0x364C7188028348566E38D762f6095741c49f492B",
        localhost_2:"0x4B5f648644865DB820490B3DEee14de9DF7fFF39",
        holesky: "0xB61f1caCE596e39202027Ad832d4F3BFFed324Ee",
        bsc_testnet: "0xf40EbeD14dea392a665196e9635828b775F034Ae",
    },

    verification: {
        localhost_1:"0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9",
        localhost_2:"0x8e590b19CcD16282333c6AF32e77bCb65e98F3c9",
        holesky: "0x8a57c09Db85f57ceEffCC9F909ddbE076E9B0019",
        bsc_testnet: "0x7565358180B98Ef5559deE2Dee99cbf368A16749",
    },

    game: {
        localhost_1:"0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7",
        localhost_2:"0x6F422FcbfF104822D27DC5BFacC5C6FA7c32af77",
        holesky: "0xC427A5002E245A4DF92a12a7C4261a5694BA4612",
        bsc_testnet: "0x2468d95ec04117b9562F9bcFb8F308B8ab4343ef",
    }
}


// External  account adresses per blockchain
export const EXTERNAL_ADDRESSES = {
    localhost_1:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    localhost_2:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    holesky: "0x0000000000000000000000000000000000000000",
    bsc_testnet: "0x0000000000000000000000000000000000000000",
}


// Block for communication contract deployment per blockchain (to search at relayer start)
export const CONTRACT_INITIAL_BLOCKS = {
    localhost_1: 21322558,
    localhost_2: 44551692,
    holesky: 1,
    bsc_testnet: 1,
}

