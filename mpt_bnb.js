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
        const txHash = "0xd82bda812cee57478eec56292fc53b46b2eef51b2a2b0e0dc2ca481141648ea1"
        const receiptRPC = await getTransactionReceipt(txHash, {chain:'bnb'});
        const blockNumber = receiptRPC.result.blockNumber;

        // Fetch block example
        const block = await getBlockByNumber(blockNumber, {chain:'bnb'})
        
        const receiptsRoot = block?.result?.receiptsRoot;

        // Fetch block receipts
        const blockRCPS = await getBlockReceipts(block?.result?.number, {chain:'bnb'})
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
