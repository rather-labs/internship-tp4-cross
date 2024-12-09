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

/**
 * Calculate gas per byte for a real transaction
 * @param {string} rpcUrl - The RPC URL of the blockchain
 * @param {string} toAddress - Contract address
 * @param {Array} abi - ABI of the contract
 * @param {string} functionName - Function name in the contract
 * @param {Array} args - Arguments for the function
 */
const calculateGasPerByte = async (rpcUrl, toAddress, contractAddress, abi, functionName, args) => {
    const gasEstimate = await estimateGasForRealTransaction(
        rpcUrl,
        toAddress,
        contractAddress,
        abi,
        functionName,
        args
    );

    // Encode the function call to get the size of the calldata
    const iface = new ethers.Interface(abi); // Instantiate the Interface
    const encodedData = iface.encodeFunctionData(functionName, args); 
    
    const dataSizeInBytes = ethers.getBytes(encodedData).length;

    return gasEstimate / BigInt(dataSizeInBytes) ;
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

// API endpoint for fee estimation
app.post("/estimateFees", async (req, res) => {
    try {
        const { toAddress, functionName, args } = req.body;

        // Validate inputs
        if (!toAddress || !functionName) {
            return res.status(400).send({ error: "toAddress and functionName are required." });
        }

        // Estimate gas per byte for the source and destination chains
        const sourceGasPerByte = await calculateGasPerByte(
            RPC_URL_SOURCE,
            toAddress,
            SOURCE_CONTRACT_ADDRESS,
            abi,
            functionName,
            args
        );
        const destinationGasPerByte = await calculateGasPerByte(
            RPC_URL_DESTINATION,
            toAddress,
            DESTINATION_CONTRACT_ADDRESS,
            abi,
            functionName,
            args
        );

        // Encode the function call to get the size of the calldata
        const iface = new ethers.Interface(abi); // Instantiate the Interface
        const encodedData = iface.encodeFunctionData(functionName, args); 
        
        const dataSizeInBytes = BigInt( ethers.getBytes(encodedData).length );

        // Execution gas estimation
        const sourceExecutionGas = sourceGasPerByte * dataSizeInBytes;
        const destinationExecutionGas = destinationGasPerByte * dataSizeInBytes;

        // Include overhead and relayer fees
        const sourceGasWithOverhead = sourceExecutionGas * (OVERHEAD_PERCENTAGE + BigInt(100))  / BigInt(100);
        const destinationGasWithOverhead = destinationExecutionGas * (OVERHEAD_PERCENTAGE + BigInt(100)) / BigInt(100);

        const totalGasWithOverhead = sourceGasWithOverhead + destinationGasWithOverhead;
        
        const relayerFee = totalGasWithOverhead * RELAYER_FEE_PERCENTAGE / BigInt(100);

        const totalFees = totalGasWithOverhead + relayerFee;

        res.json({
            sourceGasPerByte: sourceGasPerByte.toString(),
            destinationGasPerByte: destinationGasPerByte.toString(),
            sourceExecutionGas: sourceExecutionGas.toString(),
            destinationExecutionGas: destinationExecutionGas.toString(),
            totalGasWithOverhead: totalGasWithOverhead.toString(),
            relayerFee: relayerFee.toString(),
            totalFees: totalFees.toString(),
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
