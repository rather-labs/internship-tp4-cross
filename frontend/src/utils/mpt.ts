/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMPT, verifyMerkleProof, createMerkleProof } from '@ethereumjs/mpt'
import { MapDB, hexToBytes, concatBytes, bigIntToBytes } from '@ethereumjs/util'
import { RLP } from '@ethereumjs/rlp'
import { TransactionReceipt } from 'viem';

export const txTypes: Record<string, string> = {
   'eip4844': '0x03',
   'eip1559': '0x02',
   'eip2930': '0x01',
   'legacy': '0x00',
}

export const txStatus = {
    'success': '0x01',
    'reverted': '0x00',
    'failure': '0x00'
}


export function serializeReceipt(receipt: TransactionReceipt) {
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
    if (txTypes[receipt.type] !== '0x00'){
        return concatBytes(hexToBytes(txTypes[receipt.type]), RLP.encode(Data))
    }
    return RLP.encode(Data)
}

export async function getTrie(blockReceipts: TransactionReceipt[]) {
    // Create merkle patricia trie
    const trie = await createMPT({ db:  new MapDB() });
   
    try {
        for (let i = 0; i < blockReceipts.length; i++) {
            await trie.put(RLP.encode(i), serializeReceipt(blockReceipts[i]));
        }
        return trie;
    }
    catch (error) {
        console.error('Error', error);
    }
}


export async function getProof(trie: any, indexToVerify: any) {
    try {
        const proof = await createMerkleProof(trie, RLP.encode(indexToVerify));
        return proof
    }
    catch (error) {
        console.error('Error', error);
    }
}

export async function verifyProof(proof: any, indexToVerify: any) { 
    try {
        const verifiedValue = await verifyMerkleProof(RLP.encode(indexToVerify), proof);
        // Get receipt proof from trie
        return verifiedValue
    }
    catch (error) {
        console.error('Error', error);
    }
}
