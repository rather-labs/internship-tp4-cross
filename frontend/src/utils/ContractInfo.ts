import { Hex } from "viem"

// Define number of blocks for finality
export const BLOCKS_FOR_FINALITY = {
    FAST: 1,
    SLOW: 10,
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

// Import ABIs from JSON files
import incomingAbi from '../lib/abis/incoming.json'
import outgoingAbi from '../lib/abis/outgoing.json'
import verificationAbi from '../lib/abis/verification.json'
import gameAbi from '../lib/abis/game.json'

// Contract ABIS per blockchain 
export const CONTRACT_ABIS = {
    incoming: incomingAbi.abi,
    outgoing: outgoingAbi.abi,
    verification: verificationAbi.abi,
    game: gameAbi.abi
}

export const SUPPORTED_CHAINS : number[] = [17_000, 97, 31_339,31_338]
export type SUPPORTED_CHAINS_TYPE = 17_000 | 97 | 31_339 | 31_338 

export const CHAIN_NAMES = {
    [31_339]: "localhost_1",
    [31_338]: "localhost_2",
    [17_000]: "Holesky",
    [97]: "BSC_testnet",
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
    "localhost_1": 31_339,
    "localhost_2": 31_338,
    "Holesky": 17_000,
    "BSC_testnet": 97,
}

// Communication contract Adresses per blockchain
export const CONTRACT_ADDRESSES = {
    incoming:{
        localhost_1:"0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312",
        localhost_2:"0x8F28B6fF628D11A1f39c550A63D8BF73aD95d1d0",
        // Fran's Addresses
        //Holesky:"0x6c3bF781F5853A46cb62e2503f9E89E559e36dfB",
        //BSC_testnet:"0xD1313699Af6AC5F35619080583215057c5653E7F",
        //Juan's Addresses
        //Holesky:"0xD6222c86AC3aca57246c6705e6F1ff49f4EAee32", // 1
        Holesky:"0x463faa8E3fB386273d3444AC5f5D27837A56BFB7", // 2 
        BSC_testnet:"0x2221De4E3a1fe451f6Da9286537647b5C89F810f",
        
    },
    outgoing: {
        localhost_1:"0x364C7188028348566E38D762f6095741c49f492B",
        localhost_2:"0x4B5f648644865DB820490B3DEee14de9DF7fFF39",
        // Fran's Addresses
        //Holesky:"0x6b3C11d20b1BB9556f86386ADfCB084f6F79Abad",
        //BSC_testnet:"0xeD55769F96C9BA7A14dFbCc0D8a13Cc73D42B095",
        //Juan's Addresses
        //Holesky:"0x93c0DA49F9cc596D0b0C4D7Acd9A2d7E437AeF4a", // 1
        Holesky:"0xc454fcab2aAF1fD1e3b3038Ae96dD3450902Ac30", // 2
        BSC_testnet:"0x2700e66EEfE299e76ba97B341748f3F647e60c61",
    },

    verification: {
        localhost_1:"0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9",
        localhost_2:"0x8e590b19CcD16282333c6AF32e77bCb65e98F3c9",
        // Fran's Addresses
        //Holesky:"0x6A3413ca4099968Afb87b0EfB8AA399fd57378f4",
        //BSC_testnet:"0x0857ffDCEDc623b5b5E21a39A5A854bAF34EEbA2",
        //Juan's Addresses
        //Holesky:"0xfbD26084D58dfeF664FD219E946Ed6dC132C3c5D", // 1
        Holesky:"0x03B872a75f5c1D601dB73A797Ab02FDEdE60f55C", // 2
        BSC_testnet:"0x2a5b16822220DAac06Ab89Ef88B080Cd1CAdbbC4",
    },

    game: {
        localhost_1:"0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7",
        localhost_2:"0x6F422FcbfF104822D27DC5BFacC5C6FA7c32af77",
        // Fran's Addresses
        //Holesky:"0x3C57CAC009c14Fd018549821Ea585C7D0317e88d",
        //BSC_testnet:"0xa40f362263E81891293b7bD08DF6782Ff37E424b",
        //Juan's Addresses
        //Holesky:"0xF451D7957658e7098c9264367318AEF8b6E24808", // 1
        Holesky:"0xBe083706642Ab83739E81f2A924a16356f9F36e9", // 2
        BSC_testnet:"0x70165aE1d5de8e413dc17EFFd29bab8BFb39e9d7",
    }
}

// Block for communication contract deployment per blockchain 
export const CONTRACT_INITIAL_BLOCKS : Record<string, number> = {
    localhost_1: 21322558,
    localhost_2: 44551692,
    Holesky: 3251241,
    BSC_testnet: 47843414,
}

// External account adresses per blockchain for external relayer only
export const EXTERNAL_ADDRESSES = {
    localhost_1:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    localhost_2:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
}


