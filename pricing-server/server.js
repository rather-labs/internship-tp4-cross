import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;
import abi from "./abi.json" assert {type: 'json'};

// Fixed constants for relayer fee and overhead percentage
const RELAYER_FEE_PERCENTAGE = BigInt(1); // 5% relayer fee
const OVERHEAD_PERCENTAGE = BigInt(2);  // 10% overhead fee

// RPC URLs from environment variables
const RPC_URL_SOURCE = process.env.RPC_URL_SOURCE;
const RPC_URL_DESTINATION = process.env.RPC_URL_DESTINATION;

//Contract Addresses
const SOURCE_CONTRACT_ADDRESS = process.env.SOURCE_CONTRACT_ADDRESS;
const DESTINATION_CONTRACT_ADDRESS = process.env.DESTINATION_CONTRACT_ADDRESS;

if (!RPC_URL_SOURCE || !RPC_URL_DESTINATION) {
    throw new Error("RPC_URL_SOURCE and RPC_URL_DESTINATION must be defined in .env");
}

// Middleware to parse JSON requests
app.use(express.json());

// Add these constants at the top of the file with other constants
const CHAIN_DECIMALS = {
  'ethereum': 18,    // ETH: 18 decimals
  'polygon': 18,     // MATIC: 18 decimals
  'binance': 18,     // BNB: 18 decimals
  'avalanche': 18,   // AVAX: 18 decimals
  'solana': 9,       // SOL: 9 decimals
  // Add more chains as needed
};

// Add these constants at the top with other constants
const PRICE_API_ENDPOINTS = {
  'ethereum': 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  'binance': 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd',
  'polygon': 'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd',
  // Add more chains as needed
};


/**
 * Estimate gas for a real transaction
 * @param {string} rpcUrl - The RPC URL of the blockchain
 * @param {string} toAddress - Contract address
 * @param {Array} abi - ABI of the contract
 * @param {string} functionName - Function name in the contract
 * @param {Array} args - Arguments for the function
 */
const estimateGasForRealTransaction = async (
    rpcUrl,
    toAddress,
    contractAddress,
    abi,
    functionName,
    args
) => {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    // Create contract instance for ABI encoding
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Check if the function exists on the contract
    if (typeof contract[functionName] !== "function") {
        throw new Error(`Function ${functionName} does not exist on the contract.`);
    }

    // Encode function call with arguments
    const encodedData = contract.interface.encodeFunctionData(functionName, args || []);

    // Estimate gas for this transaction
    const gasEstimate = await provider.estimateGas({
        to: toAddress,
        data: encodedData.data,
    });

    return gasEstimate;
};

/**
 * Convert gas estimates to fees in native gas tokens
 * @param {BigInt} gasAmount - The gas amount to convert
 * @param {string} rpcUrl - RPC URL of the chain
 * @param {string} chainId - Chain identifier to determine decimal places
 * @returns {BigInt} The fee amount in native token's smallest denomination
 */
const gasToTokenFees = async (gasAmount, rpcUrl, chainId = 'ethereum') => {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const feeData = await provider.getFeeData();
    
    // If gasPrice is null, fall back to a manual RPC call
    let gasPrice = feeData.gasPrice;
    if (!gasPrice) {
        const gasPriceResult = await provider.send('eth_gasPrice', []);
        gasPrice = BigInt(gasPriceResult);
    }

    // Get the decimals for the chain
    const decimals = CHAIN_DECIMALS[chainId] || 18; // default to 18 if chain not found
    
    // Calculate the fee in the chain's native denomination and adjust for decimals
    const result = gasAmount * BigInt(gasPrice) * BigInt(10 ** decimals) / BigInt(10 ** 18); // Adjust for different decimal places

    return { result, gasPrice };
};

/**
 * Convert fee amount in native token to USD
 * @param {BigInt} feeInToken - Fee amount in native token's smallest denomination
 * @param {string} chainId - Chain identifier to determine price endpoint
 * @returns {number} Fee amount in USD
 */
const feeInTokenToUSD = async (feeInToken, chainId = 'ethereum') => {
    try {
        // Get the price endpoint for the chain
        const priceEndpoint = PRICE_API_ENDPOINTS[chainId];
        if (!priceEndpoint) {
            throw new Error(`Price endpoint not found for chain: ${chainId}`);
        }

        // Fetch current price
        const response = await fetch(priceEndpoint);
        const data = await response.json();
        
        // Extract price based on chainId
        const priceInUSD = data[{
            'ethereum': 'ethereum',
            'binance': 'binancecoin',
            'polygon': 'matic-network'
        }[chainId]].usd;

        // Get decimals for the chain
        const decimals = CHAIN_DECIMALS[chainId] || 18;
        
        // Convert fee to USD
        // First convert from smallest denomination to whole tokens
        const feeInWholeTokens = Number(feeInToken) / (10 ** decimals);
        // Then multiply by USD price
        return feeInWholeTokens * priceInUSD;
    } catch (error) {
        console.error(`Error converting fee to USD for chain ${chainId}:`, error);
        throw error;
    }
};

// API endpoint for fee estimation
app.post("/estimateFees", async (req, res) => {
    try {
        const { toAddress, functionName, args } = req.body;

        // Validate inputs
        if (!toAddress || !functionName) {
            return res.status(400).send({ error: "toAddress and functionName are required." });
        }

        // Estimate executiongas for the source and destination chains
        const sourceExecutionGas = await estimateGasForRealTransaction(
            RPC_URL_SOURCE,
            toAddress,
            SOURCE_CONTRACT_ADDRESS,
            abi,
            functionName,
            args
        );
        const destinationExecutionGas = await estimateGasForRealTransaction(
            RPC_URL_DESTINATION,
            toAddress,
            DESTINATION_CONTRACT_ADDRESS,
            abi,
            functionName,
            args
        );


        // Include overhead and relayer fees
        const sourceGasWithOverheadAndFees = sourceExecutionGas * (OVERHEAD_PERCENTAGE + RELAYER_FEE_PERCENTAGE + BigInt(100)) / BigInt(100);
        const destinationGasWithOverheadAndFees = destinationExecutionGas * (OVERHEAD_PERCENTAGE + RELAYER_FEE_PERCENTAGE +BigInt(100)) / BigInt(100);
        
        //Calculate fees in native tokens
        const {result: sourceTokenFees, gasPrice: sourceGasPrice} = await gasToTokenFees(sourceGasWithOverheadAndFees, RPC_URL_SOURCE);
        const {result: destinationTokenFees, gasPrice: destinationGasPrice} = await gasToTokenFees(destinationGasWithOverheadAndFees, RPC_URL_DESTINATION, 'binance');
        
        //Calculate relayer fees in native tokens
        const sourceRelayerFee = sourceExecutionGas * RELAYER_FEE_PERCENTAGE / BigInt(100);
        const destinationRelayerFee = destinationExecutionGas * RELAYER_FEE_PERCENTAGE / BigInt(100);

        const {result: sourceRelayerFeeInToken} = await gasToTokenFees(sourceRelayerFee, RPC_URL_SOURCE);
        const {result: destinationRelayerFeeInToken} = await gasToTokenFees(destinationRelayerFee, RPC_URL_DESTINATION);

        //Calculate total fee cost in usd
        const sourceFeeInUSD = await feeInTokenToUSD(sourceTokenFees, 'ethereum');
        const destinationFeeInUSD = await feeInTokenToUSD(destinationTokenFees, 'binance');
        
        const totalFeeInUSD = sourceFeeInUSD + destinationFeeInUSD 

        res.json({
            sourceExecutionGas: sourceExecutionGas.toString(),
            destinationExecutionGas: destinationExecutionGas.toString(),
            sourceGasPrice: sourceGasPrice.toString(),
            destinationGasPrice: destinationGasPrice.toString(),
            sourceTokenFees: sourceTokenFees.toString(),
            destinationTokenFees: destinationTokenFees.toString(),
            sourceRelayerFeeInToken: sourceRelayerFeeInToken.toString(),
            destinationRelayerFeeInToken: destinationRelayerFeeInToken.toString(),
            sourceFeeInUSD: sourceFeeInUSD.toFixed(3),
            destinationFeeInUSD: destinationFeeInUSD.toFixed(3),
            totalFeeInUSD: totalFeeInUSD.toFixed(3)
        });
    } catch (error) {
        console.error("Error estimating fees:", error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
