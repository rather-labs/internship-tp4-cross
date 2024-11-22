const { serializeReceipt, get_proof } = require('./mpt') 

// allow overriding to store last checked block for each chain
require('dotenv').config({ override: true }); 

async function main (){
    const txHash = "0x0c8e5bfe8af1a3cf888ea1bfe22413f4bdf8b6bc195696a983e6fd4b2b6539a5"
    const proof = await get_proof(txHash);
    console.log(proof)

}
main()