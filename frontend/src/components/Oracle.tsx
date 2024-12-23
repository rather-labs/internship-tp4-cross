import {
  useAccount,
  useClient,
  useWriteContract,
  useBlockNumber,
  useConfig,
  useChainId,
  useWatchContractEvent,
} from "wagmi";
import {
  EVENT_SIGNATURES,
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_IDS,
  CHAIN_NAMES,
  EXTERNAL_ADDRESSES,
  SUPPORTED_CHAINS,
} from "../utils/ContractInfo"; //
import React, { useEffect, useState } from "react";
import { Address, Log } from "viem";
import { getBlock } from "viem/actions";
import { getStoredData, setStoredData } from "@/utils/Store";

type ChainAddresses = (typeof CONTRACT_ADDRESSES)["outgoing"];

export default function Oracle() {
  const { address, isConnected, chainId } = useAccount();

  const {
    writeContract: writeContractBlock,
    error: errorWriteBlock,
    isPending: isPendingWriteBlock,
    isSuccess: isSuccessWriteBlock,
  } = useWriteContract();

  const {
    writeContract: writeContractInReceipt,
    error: errorWriteInReceipt,
    isPending: isPendingWriteInReceipt,
    isSuccess: isSuccessWriteInReceipt,
  } = useWriteContract();

  const [data, setData] = useState<string>("No data");

  let config = useConfig();

  const { data: blockNumber } = useBlockNumber({
    watch: true,
  });

  // Get the correct contract address for the current chain
  const verificationAddress = CONTRACT_ADDRESSES["verification"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;

  // Get the correct contract address for the current chain
  const outgoingAddress = CONTRACT_ADDRESSES["outgoing"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;

  // Get the correct contract address for the current chain
  const incomingAddress = CONTRACT_ADDRESSES["incoming"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;

  useEffect(() => {
    setData(blockNumber ? blockNumber.toString() : "");
    setStoredData(`blocknumber_${chainId}`, blockNumber?.toString() ?? "");
  }, [blockNumber]);

  const handleInboundBlockNumbers = async () => {
    for (const chain of SUPPORTED_CHAINS) {
      if (chain === chainId) continue;
      const bNumber = getStoredData(`blocknumber_${chain}`);
      try {
        writeContractBlock({
          address: verificationAddress,
          abi: JSON.parse(CONTRACT_ABIS["verification"]),
          functionName: "setLastBlock",
          args: [chain, bNumber],
        });
      } catch (error) {
        console.error("Error setting blocknumber:", error);
      }
    }
  };

  const handleInboundReceiptTrie = async () => {
    const receiptTrieRoots = getStoredData(`receiptTrieRoots_${chainId}`) ?? [];
    for (let i = 0; i < receiptTrieRoots.length; i++) {
      try {
        writeContractInReceipt({
          address: verificationAddress,
          abi: JSON.parse(CONTRACT_ABIS["verification"]),
          functionName: "setRecTrieRoot",
          args: receiptTrieRoots[i],
        });
        // Remove the successfully processed root
        receiptTrieRoots.splice(i, 1);
        i--; // Adjust index since we removed an element
      } catch (error) {
        console.error("Error setting receipt trie root:", error);
      }
    }
    setStoredData(`receiptTrieRoots_${chainId}`, receiptTrieRoots);
  };

  const handleEmitMsg = async (log: any) => {
    // Store receipt trie root in local storage
    const Block = await getBlock(config.getClient(), {
      blockNumber: log.blockNumber,
    });
    console.log("log", log);
    // Get preiviously stored receipt trie roots
    const receiptTrieRoots =
      getStoredData(`receiptTrieRoots_${log.args.destinationBC}`) ?? [];
    receiptTrieRoots.push([
      chainId,
      Number(log.blockNumber),
      Block.receiptsRoot,
    ]);
    console.log("receiptTrieRoots", receiptTrieRoots);
    setStoredData(
      `receiptTrieRoots_${log.args.destinationBC}`,
      receiptTrieRoots
    );
  };

  const handleMsgDelivered = async (log: any) => {
    // Store receipt trie root in local storage
    const Block = await getBlock(config.getClient(), {
      blockNumber: log.blockNumber,
    });
    console.log("log", log);
    // Get preiviously stored receipt trie roots
    const receiptTrieRoots =
      getStoredData(`receiptTrieRoots_${log.args.sourceBC}`) ?? [];
    receiptTrieRoots.push([
      chainId,
      Number(log.blockNumber),
      Block.receiptsRoot,
    ]);
    console.log("receiptTrieRoots", receiptTrieRoots);
    setStoredData(`receiptTrieRoots_${log.args.sourceBC}`, receiptTrieRoots);
  };

  //check if useWatchContractEvent requires third party rpc's can't be used for tutorial implementation
  useWatchContractEvent({
    address: outgoingAddress,
    abi: JSON.parse(CONTRACT_ABIS["outgoing"]),
    eventName: "OutboundMessage",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      handleEmitMsg(logs[0]);
    },
  });

  //check if useWatchContractEvent requires third party rpc's can't be used for tutorial implementation
  useWatchContractEvent({
    address: incomingAddress,
    abi: JSON.parse(CONTRACT_ABIS["incoming"]),
    eventName: "InboundMessagesRes",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      handleMsgDelivered(logs[0]);
    },
  });

  // Only watch for events if we have a valid chainId
  if (!isConnected || !chainId) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div className="p-4 rounded-lg bg-[#ffffff]">
      <h2 className="text-lg font-bold mb-2">Oracle Actions</h2>
      <h2 className="text-lg font-bold mb-2">Chain id: {chainId}</h2>
      <h2 className="text-lg font-bold mb-2">
        Chain id from config: {config.state.chainId}
      </h2>
      <h2 className="text-lg font-bold mb-2">Block number: {data}</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col space-y-4">
            <button
              className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              onClick={() => handleInboundBlockNumbers()}
              disabled={isPendingWriteBlock}
            >
              {isPendingWriteBlock ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                "Inbound stored block numbers"
              )}
            </button>
            {errorWriteBlock && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {errorWriteBlock.message}
              </div>
            )}
            {isSuccessWriteBlock && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
                Transaction successful!
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-4">
            <button
              className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              onClick={() => handleInboundReceiptTrie()}
              disabled={isPendingWriteInReceipt}
            >
              {isPendingWriteInReceipt ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : (
                "Inbound stored receipt trie roots"
              )}
            </button>
            {errorWriteInReceipt && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {errorWriteInReceipt.message}
              </div>
            )}
            {isSuccessWriteInReceipt && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
                Transaction successful!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
