const { createMPT, verifyMerkleProof, createMerkleProof } = require('@ethereumjs/mpt') 
const { bytesToHex, MapDB, hexToBytes, concatBytes, bigIntToBytes } = require('@ethereumjs/util')
const rlp = require('@ethereumjs/rlp')
import { TransactionReceipt } from 'viem';

const txTypes: Record<string, string> = {
   'eip4844': '0x03',
   'eip1559': '0x02',
   'eip2930': '0x01',
   'legacy': '0x00',
}

const txStatus = {
    'success': '0x01',
    'failure': '0x'
}


function serializeReceipt(receipt: TransactionReceipt) {
    const Data = [
        receipt.status === 'success' ? hexToBytes('0x01') : Uint8Array.from([]),
        bigIntToBytes(receipt.cumulativeGasUsed),
        hexToBytes(receipt.logsBloom),
        receipt.logs.map((log: { address: any; topics: any[]; data: any }) => [
            hexToBytes(log.address),
            log.topics.map((topic: any) => hexToBytes(topic)),
            hexToBytes(log.data),
        ]),
    ]
    if (txTypes[receipt.type] !== '0x0'){
        return concatBytes(hexToBytes(txTypes[receipt.type]), rlp.encode(Data))
    }
    return rlp.encode(Data)
}

async function getTrie(blockReceipts: TransactionReceipt[]) {
    // Create merkle patricia trie
    const trie = await createMPT({ db:  new MapDB() });
   
    try {
        for (let i = 0; i < blockReceipts.length; i++) {
            await trie.put(rlp.encode(i), serializeReceipt(blockReceipts[i]));
        }
        return trie;
    }
    catch (error) {
        console.error('Error', error);
    }
}


async function getProof(trie: any, indexToVerify: any) {
    try {
        const proof = await createMerkleProof(trie, rlp.encode(indexToVerify));
        return proof
    }
    catch (error) {
        console.error('Error', error);
    }
}

async function verifyProof(proof: any, indexToVerify: any) { 
    try {
        const verifiedValue = await verifyMerkleProof(rlp.encode(indexToVerify), proof);
        // Get receipt proof from trie
        return verifiedValue
    }
    catch (error) {
        console.error('Error', error);
    }
}

module.exports = {
    txTypes,
    txStatus,
    serializeReceipt,
    getTrie,
    getProof,
    verifyProof
}