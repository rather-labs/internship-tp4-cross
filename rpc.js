const https = require('https');

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

module.exports = {
    makeRpcRequest,
}