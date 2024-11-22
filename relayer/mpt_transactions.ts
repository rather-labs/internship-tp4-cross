const { createMPT, MerklePatriciaTrie } = require('@ethereumjs/mpt') 
const { Trie } = require('@ethereumjs/trie');
const { bytesToHex, MapDB, hexToBytes, intToBytes, concatBytes, utf8ToBytes, bigIntToBytes, hexToBigInt } = require('@ethereumjs/util')
const rlp = require('@ethereumjs/rlp')
const { getTransactionReceipt, getBlockReceipts, getBlockByHash, getBlockByNumber, getTransactionByHash } = require('./rpc-eth')
const { keccak256 } = require('ethereum-cryptography/keccak')
const { Common } = require('@ethereumjs/common')
import {TxReceipt} from '@ethereumjs/vm'
import { genTransactionsTrieRoot }  from './Functions'

async function main() {

    try {
        // Transaction
        const txHash = "0x0c8e5bfe8af1a3cf888ea1bfe22413f4bdf8b6bc195696a983e6fd4b2b6539a5"
        const receiptRPC = await getTransactionReceipt(txHash);
        const blockHash = receiptRPC.result.blockHash;

        //const txRes = await getTransactionByHash(txHash) 
        //const tx = txRes?.result
        //console.log(tx)

        // Fetch block example
        const block = await getBlockByHash(blockHash);

        
        const blockWithTxs = await getBlockByNumber(block?.result?.number, {getTransactions:true});
        const txsRoot = await genTransactionsTrieRoot(blockWithTxs?.result?.transactions)
        
        console.log("Original transaction root  : " + blockWithTxs?.result?.transactionsRoot)
        console.log("Calculated transaction root: " + bytesToHex(txsRoot))

        return

    }
    catch (error) {
        console.error('Error', error);
    }
}

main();
