const https = require('https');


const ENDPOINTS = {
    "eth": {
        'infura' :'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
        'alchemy':'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_PROJECT_ID,
    },
    "bnb":  {
        'infura' :'https://bsc-dataseed.binance.org/',
        'alchemy':'https://bsc-dataseed.binance.org/',

    },
    "bnc":  {
        'infura' :'https://bsc-dataseed.binance.org/',
        'alchemy':'https://bsc-dataseed.binance.org/',
    },
}

async function makeRpcRequest(endpoint, options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(endpoint, options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.error) {
                        reject(result.error);
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}


// Looking up an individual transaction
async function getTransactionReceipt(transactionHash, opts={}) {
    const { chain = "eth", rpc='alchemy' } = opts;

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
 
    return makeRpcRequest(ENDPOINTS[chain][rpc], options, data);
}

async function getTransactionByHash(transactionHash, opts={}) {
    const { chain = "eth", rpc='alchemy' } = opts;
    
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

    return makeRpcRequest(ENDPOINTS[chain][rpc], options, data);
}


async function getBlockReceipts(BlockNumber, opts={}) {
    const { chain = "eth", rpc='alchemy' } = opts;
    
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

    return makeRpcRequest(ENDPOINTS[chain][rpc], options, data);
}

async function getBlockByHash(blockHash, opts={}) {
    const { chain = "eth", rpc='alchemy' } = opts;

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
    
    return makeRpcRequest(ENDPOINTS[chain][rpc], options, data);
}

async function getBlockByNumber(blockNumber, opts={}) {
    const { chain = "eth", rpc='alchemy', getTransactions=false } = opts;

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
    
    return makeRpcRequest(ENDPOINTS[chain][rpc], options, data);
}

module.exports = {
    getTransactionReceipt,
    getTransactionByHash,
    getBlockReceipts,
    getBlockByHash,
    getBlockByNumber
}