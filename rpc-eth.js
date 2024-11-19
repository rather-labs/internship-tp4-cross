const makeRpcRequest = require('./rpc').makeRpcRequest;
const ENDPOINTS = {
    "eth": 'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
    "bnb": 'https://bsc-dataseed.binance.org/',
    "bnc": 'https://bsc-dataseed.binance.org/',
}



// Looking up an individual transaction
async function getTransactionReceipt(transactionHash, opts={}) {
    const { chain = "eth" } = opts;

    const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
        id: 2,
    })

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    }
 
    return makeRpcRequest(ENDPOINTS[chain], options, data);
}

async function getTransactionByHash(transactionHash, opts={}) {
    const { chain = "eth" } = opts;
    
    const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [transactionHash],
        id: 1,
    })

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    }

    return makeRpcRequest(ENDPOINTS[chain], options, data);
}


async function getBlockReceipts(BlockNumber, opts={}) {
    const { chain = "eth" } = opts;
    
    const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockReceipts',
        params: [BlockNumber],
        id: 1,
    })

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    }

    return makeRpcRequest(ENDPOINTS[chain], options, data);
}

async function getBlockByHash(blockHash, opts={}) {
    const { chain = "eth" } = opts;

    const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByHash',
        params: [blockHash, false],
        id: 1,
    })

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    }
    
    return makeRpcRequest(ENDPOINTS[chain], options, data);
}

async function getBlockByNumber(blockNumber, opts={}) {
    const { chain = "eth", getTransactions=false } = opts;

    const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, getTransactions],
        id: 1,
    })

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    }
    
    return makeRpcRequest(ENDPOINTS[chain], options, data);
}

module.exports = {
    getTransactionReceipt,
    getTransactionByHash,
    getBlockReceipts,
    getBlockByHash,
    getBlockByNumber
}