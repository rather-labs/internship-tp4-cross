const { createMPT, verifyMerkleProof, createMerkleProof } = require('@ethereumjs/mpt') 
const { bytesToHex, MapDB, hexToBytes, concatBytes, bigIntToBytes } = require('@ethereumjs/util')
const rlp = require('@ethereumjs/rlp')


const txTypes = {
   'eip4844': '0x03',
   'eip1559': '0x02',
   'eip2930': '0x01',
   'legacy': '0x00',
}

const txStatus = {
    'success': '0x01',
    'failure': '0x'
}
function serializeReceipt(receipt) {
    const Data = [
        receipt.status === 'success' ? hexToBytes('0x01') : Uint8Array.from([]),
        bigIntToBytes(receipt.cumulativeGasUsed),
        hexToBytes(receipt.logsBloom),
        receipt.logs.map(log => [
            hexToBytes(log.address),
            log.topics.map(topic => hexToBytes(topic)),
            hexToBytes(log.data),
        ]),
    ]
    if (txTypes[receipt.type] !== '0x0'){
        return concatBytes(hexToBytes(txTypes[receipt.type]), rlp.encode(Data))
    }
    return rlp.encode(Data)
}

async function getTrie(blockReceipts) {
    // Create merkle patricia trie
    const trie = await createMPT({ db:  new MapDB() });
   
    try {
        // Insert each transaction receipt into the trie with promiseAll now
        for (const [index, receipt] of blockReceipts.entries()) {
        //await Promise.all(blockReceipts.map(async (receipt, index) => {     
            await trie.put(rlp.encode(index), serializeReceipt(receipt));

        };
        return trie
    }
    catch (error) {
        console.error('Error', error);
    }
}


async function getProof(trie, indexToVerify) {
    try {
        const proof = await createMerkleProof(trie, rlp.encode(indexToVerify));
        return proof
    }
    catch (error) {
        console.error('Error', error);
    }
}

async function verifyProof(proof, indexToVerify) { 
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