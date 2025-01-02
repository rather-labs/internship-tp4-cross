"use client";
import {
  useAccount,
  useBlockNumber,
  useConfig,
  useWatchContractEvent,
} from "wagmi";
import { writeContract } from "@wagmi/core";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
} from "../utils/ContractInfo"; //
import React, { useEffect, useState } from "react";
import { Address } from "viem";
import { getBlock, waitForTransactionReceipt } from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";
import { useGame } from "../contexts/GameContext";
import { Tooltip } from "./Tooltip";

type ChainAddresses = (typeof CONTRACT_ADDRESSES)["outgoing"];

export default function OracleButton() {
  const { isConnected, chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

  let config = useConfig();

  const [errorWriteBlock, setErrorWriteBlock] = useState("");
  const [isPendingWriteBlock, setPendingWriteBlock] = useState(false);
  const [isSuccessWriteBlock, setSuccessWriteBlock] = useState(false);

  const [errorWriteInReceipt, setErrorWriteInReceipt] = useState("");
  const [isPendingWriteInReceipt, setPendingWriteInReceipt] = useState(false);
  const [isSuccessWriteInReceipt, setSuccessWriteInReceipt] = useState(false);

  const { data: blockNumber } = useBlockNumber({
    watch: true,
  });

  const { setIsOracleCalled, finalitySpeed, moveBlockNumber } = useGame();
  const [isEnabled, setIsEnabled] = useState(false);
  const [blocksRemaining, setBlocksRemaining] = useState<number | null>(null);

  const requiredBlocks = finalitySpeed === "FAST" ? 3 : 5;

  // Get the correct contract address for the current chain
  const verificationAddress = CONTRACT_ADDRESSES["verification"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;

  // Get the correct contract address for the current chain
  const outgoingAddress = CONTRACT_ADDRESSES["outgoing"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;

  useEffect(() => {
    if (blockNumber === undefined || chainId === undefined) return;
    dispatch({
      type: "UPDATE_BLOCK_NUMBER",
      chainId: chainId,
      blockNumber: Number(blockNumber),
    });
    console.log("Oracle: blockNumber", blockNumber);
    console.log(chainData);
  }, [blockNumber]);

  useEffect(() => {
    if (blockNumber === undefined || chainId === undefined) return;
    if (moveBlockNumber) {
      const blocksPassed = Number(blockNumber) - Number(moveBlockNumber);
      const remaining = Math.max(0, requiredBlocks - blocksPassed);
      setBlocksRemaining(remaining);
      setIsEnabled(blocksPassed >= requiredBlocks);
    }
  }, [blockNumber, moveBlockNumber, requiredBlocks]);

  const handleInboundBlockNumbers = async () => {
    console.log("Oracle: handleInboundBlockNumbers");
    for (const chain of SUPPORTED_CHAINS) {
      if (chain === chainId || chainData[chain] === undefined) continue;
      setErrorWriteBlock("");
      setPendingWriteBlock(true);
      setSuccessWriteBlock(false);
      try {
        const txHash = await writeContract(config, {
          address: verificationAddress,
          abi: JSON.parse(CONTRACT_ABIS["verification"]),
          functionName: "setLastBlock",
          args: [chain, chainData[chain].blockNumber],
        });
        await waitForTransactionReceipt(config, {
          hash: txHash,
        });
        setSuccessWriteBlock(true);
      } catch (error: any) {
        console.error("Error setting blocknumber:", error);
        setErrorWriteBlock(error.message);
      }
      setPendingWriteBlock(false);
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
      setErrorWriteInReceipt("");
      setPendingWriteInReceipt(true);
      setSuccessWriteInReceipt(false);
      try {
        const txHash = await writeContract(config, {
          address: verificationAddress,
          abi: JSON.parse(CONTRACT_ABIS["verification"]),
          functionName: "setRecTrieRoot",
          args: receipt,
        });
        await waitForTransactionReceipt(config, {
          hash: txHash,
        });
        // Remove the inbount root
        dispatch({
          type: "REMOVE_RECEIPT_TRIE_ROOT",
          chainId,
          sourceId: receipt[0],
          blockNumber: receipt[1],
        });
        setSuccessWriteInReceipt(true);
      } catch (error: any) {
        console.error("Error setting receipt trie root:", error);
        setErrorWriteInReceipt(error.message);
      }
      setPendingWriteInReceipt(false);
    }
  };

  const handleEmitMsg = async (log: any) => {
    console.log("Oracle: handleEmitMsg");
    // Store receipt trie root in local storage
    const Block = await getBlock(config, {
      blockNumber: log.blockNumber,
    });
    if (chainId === undefined) return;
    dispatch({
      type: "ADD_RECEIPT_TRIE_ROOT",
      chainId: log.args.destinationBC,
      sourceId: chainId,
      blockNumber: Number(log.blockNumber),
      root: Block.receiptsRoot,
    });
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

  // As there's no payment to relayer, this is not needed
  //const handleMsgDelivered = async (log: any) => {
  //  console.log("Oracle: handleMsgDelivered");
  //  const Block = await getBlock(config, {
  //    blockNumber: log.blockNumber,
  //  });
  //  dispatch({
  //    type: "ADD_RECEIPT_TRIE_ROOT",
  //    chainId: chainId ?? 0,
  //    blockNumber: log.blockNumber,
  //    root: Block.receiptsRoot,
  //  });
  //};
  //useWatchContractEvent({
  //  address: incomingAddress,
  //  abi: JSON.parse(CONTRACT_ABIS["incoming"]),
  //  eventName: "InboundMessagesRes",
  //  pollingInterval: 10_000,
  //  onLogs(logs: any) {
  //    handleMsgDelivered(logs[0]);
  //  },
  //});

  // Only watch for events if we have a valid chainId
  if (!isConnected || !chainId) {
    return <div>Please connect your wallet</div>;
  }

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
                Waiting for {blocksRemaining} more block
                {blocksRemaining !== 1 ? "s" : ""}
                <span className="animate-pulse">...</span>
              </p>
              <p className="text-sm text-gray-500">
                {finalitySpeed === "FAST"
                  ? "Fast mode requires 2 block confirmations"
                  : "Slow mode requires 5 block confirmations"}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-green-600">
              Countdown finished, you can now call the oracle to submit the
              information.
            </p>
          )}
        </div>
      )}

      {/* Oracle button */}
      {!isSuccessWriteBlock && !isSuccessWriteInReceipt && (
        <button
          className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
            isEnabled
              ? "bg-[#F6851B] hover:bg-[#E2761B]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={handleOracleCall}
          disabled={
            !isEnabled || isPendingWriteBlock || isPendingWriteInReceipt
          }
        >
          {isPendingWriteBlock || isPendingWriteInReceipt ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : isEnabled ? (
            "Call Oracle"
          ) : (
            "Please Wait..."
          )}
        </button>
      )}

      {(errorWriteBlock || errorWriteInReceipt) && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {errorWriteBlock || errorWriteInReceipt}
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
