import { createPublicClient, 
        createWalletClient, 
        parseAbiItem, 
        webSocket, 
        decodeEventLog 
      } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { parseEther, WalletClient, PublicClient, Account, Address, Abi, AbiEvent } from 'viem';



import { http, createConfig, simulateContract, writeContract } from '@wagmi/core'
import { useWriteContract, useWatchContractEvent , useEstimateFeesPerGas  } from 'wagmi'



function ContractInteraction() {
  const { writeContract } = useWriteContract()

}


const handleWrite = async () => {
  try {
    const hash = await writeContract({
      address: '0x...',
      abi: [...],
      functionName: 'yourFunction',
      args: [arg1, arg2],
      account: '0x...'
    })
    console.log('Transaction hash:', hash)
  } catch (error) {
    console.error('Failed to write:', error)
  }
}

export async function WriteToContract(
  address: Address,
  abi: Abi,
  functionName: string,
  args: any[],
  maxAttempts: number = 5
) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      attempt++;
      const { request } = await simulateContract(config, {
        abi,
        address,
        functionName,
        args
      })
      const { write, data, isLoading, isSuccess } = useWriteContract(config)
      if (isSuccess) {
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
         console.error('Transaction failed after ${maxAttempts} attempts:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Waits for 0.5 seconds before retry
    }
  }
}

// Function to listen for contract events in a specific block
export async function listenForContractEventsInBlock(
  client: PublicClient,
  address: Address,
  event: string,
  contractABI: Abi,
  blockNumber: number,
  handleNewEvent: (log: any, decoded: any, data: any) => Promise<void>,
  data: any
) {
    // Define your event filter (e.g., ExampleEvent)
    const eventFilter = {
      address,
      event:parseAbiItem(event) as AbiEvent,
      block: blockNumber, // Listen for events in this block
    };

    // Get logs for the contract event
    await client.getLogs(eventFilter)
    .then(async (logs) => {
      // Create an array of promises to handle logs concurrently
      const logPromises = logs.map(async (log) => {
        try {
          // Decode the event log based on your contract ABI
          const decoded = decodeEventLog({
            abi: contractABI,
            data: log.data,
            topics: log.topics,
          });
  
          // Process the log asynchronously
          await handleNewEvent(log, decoded, data);
        } catch (error) {
          console.error('Error processing log:', error);
        }
      });
  
      // Wait for all logs to be processed concurrently
      await Promise.all(logPromises);
    })
    .catch((error) => {
      console.error('Error fetching logs:', error);
    });
};
