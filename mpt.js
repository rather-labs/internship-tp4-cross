const { createMPT, verifyMerkleProof, createMerkleProof } = require('@ethereumjs/mpt') 
const { bytesToHex, MapDB, hexToBytes, concatBytes} = require('@ethereumjs/util')
const rlp = require('@ethereumjs/rlp')
const { getTransactionReceipt, getBlockReceipts, getBlockByNumber} = require('./rpc-eth')

function serializeReceipt(receipt) {
    const Data = [
        receipt.status === '0x0' ? Uint8Array.from([]) : hexToBytes('0x01'),
        hexToBytes(receipt.cumulativeGasUsed),
        hexToBytes(receipt.logsBloom),
        receipt.logs.map(log => [
            hexToBytes(log.address),
            log.topics.map(topic => hexToBytes(topic)),
            hexToBytes(log.data),
        ]),
    ]
    if (receipt.type !== '0x0'){
        return concatBytes(hexToBytes(receipt.type), rlp.encode(Data))
    }
    return rlp.encode(Data)
}

async function main() {
    // Create merkle patricia trie
    const db = new MapDB() 
    const trie = await createMPT({ db: db});
   
    try {
        // Transaction
        const txHash = "0x0c8e5bfe8af1a3cf888ea1bfe22413f4bdf8b6bc195696a983e6fd4b2b6539a5"
        const receiptRPC = await getTransactionReceipt(txHash);
        const blockNumber = receiptRPC.result.blockNumber;

        // Fetch block example
        const block = await getBlockByNumber(blockNumber);
        
        const receiptsRoot = block?.result?.receiptsRoot;

        // Fetch block receipts
        const blockRCPS = await getBlockReceipts(block?.result?.number)
        const blockReceipts = blockRCPS?.result;

        // Insert each transaction receipt into the trie with promiseAll now
        for (const [index, receipt] of blockReceipts.entries()) {
        //await Promise.all(blockReceipts.map(async (receipt, index) => {     
            await trie.put(rlp.encode(index), serializeReceipt(receipt));

        };
        console.log('Original Receipts Trie root hash:', receiptsRoot);
        console.log('Local Receipts Trie root hash   :', bytesToHex(trie.root()));

        const indexToVerify = 1
        const key = rlp.encode(indexToVerify)
        const proof = await createMerkleProof(trie, key);
        //console.log(proof);
        // Optional: Verify the proof
        const verifiedValue = await verifyMerkleProof(key, proof);
        //console.log("Original value      :", bytesToHex(serializeReceipt(blockReceipts[0])));
        //console.log("Proof verified value:", bytesToHex(verifiedValue));

        // Get receipt proof from trie
        console.log("Verified: " + (bytesToHex(verifiedValue) === bytesToHex(serializeReceipt(blockReceipts[indexToVerify]))))

    }
    catch (error) {
        console.error('Error', error);
    }
}

main();
