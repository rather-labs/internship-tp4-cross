import {
  useAccount,
  useWriteContract,
  useBlockNumber,
  useConfig,
  useWatchContractEvent,
} from "wagmi";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
} from "../utils/ContractInfo"; //
import React, { useEffect } from "react";
import { Address } from "viem";
import { getBlock } from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";

type ChainAddresses = (typeof CONTRACT_ADDRESSES)["outgoing"];

export default function Oracle() {
  const { isConnected, chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

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
    dispatch({
      type: "UPDATE_BLOCK_NUMBER",
      chainId: chainId ?? 0,
      blockNumber: Number(blockNumber ?? 0),
    });
    console.log("Oracle: blockNumber", blockNumber);
    console.log(chainData);
  }, [blockNumber]);

  const handleInboundBlockNumbers = async () => {
    console.log("Oracle: handleInboundBlockNumbers");
    for (const chain of SUPPORTED_CHAINS) {
      if (chain === chainId || chainData[chain] === undefined) continue;
      try {
        writeContractBlock({
          address: verificationAddress,
          abi: JSON.parse(CONTRACT_ABIS["verification"]),
          functionName: "setLastBlock",
          args: [chain, chainData[chain].blockNumber],
        });
      } catch (error) {
        console.error("Error setting blocknumber:", error);
      }
    }
  };

  const handleInboundReceiptTrie = async () => {
    console.log("Oracle: handleInboundReceiptTrie");
    if (
      chainId === undefined ||
      chainData[chainId] === undefined ||
      chainData[chainId].receiptTrieRoots === undefined
    )
      return;
    for (const receipt of chainData[chainId].receiptTrieRoots) {
      try {
        writeContractInReceipt({
          address: verificationAddress,
          abi: JSON.parse(CONTRACT_ABIS["verification"]),
          functionName: "setRecTrieRoot",
          args: [chainId, ...receipt],
        });
        // Remove the inbount root
        dispatch({
          type: "REMOVE_RECEIPT_TRIE_ROOT",
          chainId,
          blockNumber: receipt[0],
        });
      } catch (error) {
        console.error("Error setting receipt trie root:", error);
      }
    }
  };

  const handleEmitMsg = async (log: any) => {
    console.log("Oracle: handleEmitMsg");
    // Store receipt trie root in local storage
    const Block = await getBlock(config, {
      blockNumber: log.blockNumber,
    });
    dispatch({
      type: "ADD_RECEIPT_TRIE_ROOT",
      chainId: log.args.destinationBC,
      blockNumber: log.blockNumber,
      root: Block.receiptsRoot,
    });
  };

  const handleMsgDelivered = async (log: any) => {
    console.log("Oracle: handleMsgDelivered");
    // Store receipt trie root in local storage
    const Block = await getBlock(config, {
      blockNumber: log.blockNumber,
    });
    dispatch({
      type: "ADD_RECEIPT_TRIE_ROOT",
      chainId: chainId ?? 0,
      blockNumber: log.blockNumber,
      root: Block.receiptsRoot,
    });
  };

  //check if useWatchContractEvent requires third party rpc's can't be used for tutorial implementation
  useWatchContractEvent({
    address: outgoingAddress,
    abi: JSON.parse(CONTRACT_ABIS["outgoing"]),
    eventName: "OutboundMessage",
    pollingInterval: 20_000,
    onLogs(logs: any) {
      handleEmitMsg(logs[0]);
    },
  });

  //check if useWatchContractEvent requires third party rpc's can't be used for tutorial implementation
  useWatchContractEvent({
    address: incomingAddress,
    abi: JSON.parse(CONTRACT_ABIS["incoming"]),
    eventName: "InboundMessagesRes",
    pollingInterval: 20_000,
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
      <div className="flex flex-row space-x-6">
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
              "Inbound block numbers"
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
              "Inbound receipt trie roots for listened events"
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
  );
}
