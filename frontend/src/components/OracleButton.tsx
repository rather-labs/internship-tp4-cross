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
import { useGame } from "../context/GameContext";
import { Tooltip } from "./Tooltip";

type ChainAddresses = (typeof CONTRACT_ADDRESSES)["outgoing"];

export function OracleButton() {
  const { setIsOracleCalled, finalitySpeed, moveBlockNumber } = useGame();
  const { data: currentBlockNumber } = useBlockNumber({ watch: true });
  const [isEnabled, setIsEnabled] = useState(false);
  const [blocksRemaining, setBlocksRemaining] = useState<number | null>(null);

  const requiredBlocks = finalitySpeed === 'FAST' ? 3 : 5;

  // Check block progress
  useEffect(() => {
    if (moveBlockNumber && currentBlockNumber) {
      const blocksPassed = Number(currentBlockNumber) - Number(moveBlockNumber);
      const remaining = Math.max(0, requiredBlocks - blocksPassed);
      setBlocksRemaining(remaining);
      setIsEnabled(blocksPassed >= requiredBlocks);
    }
  }, [currentBlockNumber, moveBlockNumber, requiredBlocks]);

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

  const handleOracleCall = async () => {
    try {
      await handleInboundReceiptTrie();
      await handleInboundBlockNumbers();
    } catch (error) {
      console.error("Error calling oracle:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Block countdown TODO: handle block revert */}
      {blocksRemaining !== null && (
        <div className="text-center">
          {blocksRemaining > 0 ? (
            <>
              <p className="text-lg font-semibold text-gray-700">
                Waiting for {blocksRemaining} more block{blocksRemaining !== 1 ? 's' : ''} 
                <span className="animate-pulse">...</span>
              </p>
              <p className="text-sm text-gray-500">
                {finalitySpeed === 'FAST' ? 
                  'Fast mode requires 2 block confirmations' : 
                  'Slow mode requires 5 block confirmations'}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-green-600">
              Countdown finished, you can now call the oracle to submit the information.
            </p>
          )}
        </div>
      )}

      {/* Oracle button */}
      {!isSuccessWriteBlock && !isSuccessWriteInReceipt && (
        <button
          className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
            isEnabled ? 
              'bg-[#F6851B] hover:bg-[#E2761B]' : 
              'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleOracleCall}
          disabled={!isEnabled || isPendingWriteBlock || isPendingWriteInReceipt}
        >
          {isPendingWriteBlock || isPendingWriteInReceipt ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : (
            isEnabled ? "Call Oracle" : "Please Wait..."
          )}
        </button>
      )}

      {(errorWriteBlock || errorWriteInReceipt) && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {errorWriteBlock?.message || errorWriteInReceipt?.message}
        </div>
      )}

      {(isSuccessWriteBlock || isSuccessWriteInReceipt) && (
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
            Transaction successful!
          </div>
          <div className="flex items-center justify-center gap-4">
            <button 
              className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
              onClick={() => setIsOracleCalled(true)}
            >
              Relay Message Now
            </button>
            <Tooltip
                content="The speed configuration determines the number of blocks the oracle will wait until sending the message receipt trie. If we select to wait more blocks we will have to wait longer but we will not risk having a chain reordering event that removes our message from the source chain."
                link={{
                  href: "https://docs.axsdasdsadsadelar.dev/",
                  text: "Learn More",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}