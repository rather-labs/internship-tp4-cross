"use client";
import {
  useAccount,
  useBlockNumber,
  useConfig,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
  BLOCKS_FOR_FINALITY,
} from "../utils/ContractInfo"; //
import React, { useEffect, useState } from "react";
import { Address } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";
import { useGame } from "../contexts/GameContext";
import { Tooltip } from "./Tooltip";
type ChainAddresses = (typeof CONTRACT_ADDRESSES)["outgoing"];

export default function OracleButton() {
  let config = useConfig();

  let { isConnected, chainId } = useAccount({ config });

  const {
    switchChainAsync: switchChain,
    error: switchChainError,
    isPending: switchChainIsPending,
  } = useSwitchChain({ config });

  const {
    writeContractAsync: writeContractBlock,
    error: errorWriteBlock,
    isSuccess: isSuccessWriteBlock,
  } = useWriteContract({ config });

  const {
    writeContractAsync: writeContractInReceipt,
    error: errorWriteInReceipt,
    isSuccess: isSuccessWriteInReceipt,
  } = useWriteContract({ config });

  const [isPendingOracle, setIsPendingOracle] = useState(false);

  const { state: chainData, dispatch } = useChainData();

  const {
    setGameState,
    finalitySpeed,
    moveBlockNumber,
    blockchains,
    moveNumber,
  } = useGame();

  const [blocksRemaining, setBlocksRemaining] = useState<number>(-1);

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (blocksRemaining === -1) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
    } else {
      setLoadingTimeout(false);
    }
    return () => clearTimeout(timeoutId);
  }, [blocksRemaining]);

  // Get the correct contract address for the current chain
  const verificationAddress = CONTRACT_ADDRESSES["verification"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;
  useEffect(() => {
    if (
      chainId === undefined ||
      chainData[chainId] === undefined ||
      chainData[chainId].blockNumber === 0
    ) {
      return;
    }
    if (chainId == blockchains[moveNumber % 2]) {
      const moveChainId = blockchains[(moveNumber + 1) % 2];
      const remaining = Math.max(
        0,
        (finalitySpeed ? BLOCKS_FOR_FINALITY[finalitySpeed] : 0) +
          Number(moveBlockNumber) -
          chainData[moveChainId ?? 0]?.blockNumber
      );
      setBlocksRemaining(remaining);
      return;
    }
    if (moveBlockNumber) {
      const remaining = Math.max(
        0,
        (finalitySpeed ? BLOCKS_FOR_FINALITY[finalitySpeed] : 0) +
          Number(moveBlockNumber) -
          Number(chainData[chainId].blockNumber)
      );
      setBlocksRemaining(remaining);
    }
  }, [, chainId, chainData, moveBlockNumber, finalitySpeed]);

  const handleInboundBlockNumbers = async () => {
    console.log("handleInboundBlockNumbers");
    if (chainId === undefined) {
      return;
    }
    const chain = blockchains[(moveNumber + 1) % 2];
    if (chain === undefined || chainData[chain].blockNumber === undefined) {
      console.log("Blocknumber not present in chainData for chain", chain);
      return;
    }
    try {
      return await writeContractBlock({
        address: verificationAddress,
        abi: CONTRACT_ABIS["verification"],
        functionName: "setLastBlock",
        args: [chain, chainData[chain].blockNumber],
      });
    } catch (error: any) {
      console.error("Error setting blocknumber:", error);
    }
  };

  const handleInboundReceiptTrie = async () => {
    console.log("handleInboundReceiptTrie");
    if (
      chainId === undefined ||
      chainData[chainId] === undefined ||
      chainData[chainId]?.receiptTrieRoots === undefined
    ) {
      throw new Error("Undefined Chain Id");
    }

    const txHashes = [];
    for (const receipt of chainData[chainId].receiptTrieRoots) {
      try {
        const txHash = await writeContractInReceipt({
          address: verificationAddress,
          abi: CONTRACT_ABIS["verification"],
          functionName: "setRecTrieRoot",
          args: receipt,
        });
        txHashes.push(txHash);
      } catch (error: any) {
        console.error("Error setting receipt trie root:", error);
      }
    }
    return txHashes;
  };

  // Only watch for events if we have a valid chainId
  if (!isConnected || !chainId) {
    return <div>Please connect your wallet</div>;
  }

  const handleOracleCall = async () => {
    try {
      setIsPendingOracle(true);
      const txReceiptHashes = await handleInboundReceiptTrie();
      //wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const txBlockHash = await handleInboundBlockNumbers();
      if (txBlockHash === undefined) {
        throw new Error("Transaction for block number failed");
      }

      const [txBlock, ...txReceipts] = await Promise.all([
        waitForTransactionReceipt(config, { hash: txBlockHash }),
        ...txReceiptHashes.map((hash) =>
          waitForTransactionReceipt(config, { hash: hash as `0x${string}` })
        ),
      ]);

      if (txBlock.status === "reverted") {
        throw new Error(
          "Transaction Recepit for block number status returned as reverted"
        );
      }
      for (const [index, txReceipt] of txReceipts.entries()) {
        if (txReceipt.status === "reverted") {
          throw new Error(
            "Transaction Recepit for receipt trie root status returned as reverted"
          );
        }
        // Remove the sent root
        dispatch({
          type: "REMOVE_RECEIPT_TRIE_ROOT",
          chainId,
          sourceId: chainData[chainId].receiptTrieRoots[index][0],
          blockNumber: chainData[chainId].receiptTrieRoots[index][1],
        });
      }

      setIsPendingOracle(false);
    } catch (error) {
      console.error("Error calling oracle:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Block countdown TODO: handle block revert */}
      <div className="text-center">
        {blocksRemaining > 0 && (
          <>
            <p className="text-lg font-semibold text-gray-700">
              Waiting for {blocksRemaining} more block
              {blocksRemaining !== 1 ? "s" : ""}
              <span className="animate-pulse">...</span>
            </p>
            <p className="text-sm text-gray-500">
              {finalitySpeed === "FAST"
                ? `Fast mode requires ${BLOCKS_FOR_FINALITY["FAST"]} block${
                    BLOCKS_FOR_FINALITY["FAST"] > 1 ? "s" : ""
                  } confirmation${
                    BLOCKS_FOR_FINALITY["FAST"] > 1 ? "s" : ""
                  }, please wait...`
                : `Slow mode requires ${BLOCKS_FOR_FINALITY["SLOW"]} block${
                    BLOCKS_FOR_FINALITY["SLOW"] > 1 ? "s" : ""
                  } confirmation${
                    BLOCKS_FOR_FINALITY["SLOW"] > 1 ? "s" : ""
                  }, please wait...`}
            </p>
          </>
        )}
        {blocksRemaining == 0 && (
          <p className="text-lg font-semibold text-green-600">
            The countdown has finished.
            <br />
            {chainData[
              blockchains[(moveNumber + 1) % 2] as keyof typeof chainData
            ]?.blockNumber > 0
              ? `Current Block: ${
                  chainData[
                    blockchains[(moveNumber + 1) % 2] as keyof typeof chainData
                  ]?.blockNumber
                }`
              : ""}
            <br />
            You can now Switch Network and Call the Oracle to submit this
            information.
          </p>
        )}
        {blocksRemaining == -1 && (
          <div className="text-center">
            {!loadingTimeout ? (
              <p className="text-xl mr-8 font-semibold text-gray-700">
                <span className="animate-pulse">...</span>
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg  text-gray-700">
                  Block number reception is taking longer than expected <br />
                  Keep waiting or...
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#F6851B] hover:bg-[#E2761B] px-4 py-2 rounded-lg text-white font-bold"
                >
                  Force Update
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Switch Network Button */}
      <div className="flex items-center justify-center gap-4">
        <button
          className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
            switchChainIsPending ||
            (chainId == blockchains[moveNumber % 2] && blocksRemaining == 0) ||
            (chainId != blockchains[moveNumber % 2] && blocksRemaining != 0)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#F6851B] hover:bg-[#E2761B]"
          }`}
          onClick={async () => {
            await switchChain({
              chainId:
                blockchains[blockchains.indexOf(chainId) == 0 ? 1 : 0] ?? 0,
            });
          }}
          disabled={
            switchChainIsPending ||
            (chainId == blockchains[moveNumber % 2] && blocksRemaining == 0) ||
            (chainId != blockchains[moveNumber % 2] && blocksRemaining != 0)
          }
        >
          {switchChainIsPending
            ? "Please Wait..."
            : chainId != blockchains[moveNumber % 2]
              ? `Switch network to: ${CHAIN_NAMES[blockchains[moveNumber % 2] as keyof typeof CHAIN_NAMES]}`
              : blocksRemaining != 0
                ? `Switch network to wait for finality, to: ${CHAIN_NAMES[blockchains[(moveNumber + 1) % 2] as keyof typeof CHAIN_NAMES]}`
                : "On the right chain to call the Oracle"}
        </button>
        <Tooltip content="You have to be in the message sender chain to listen current block number and in the destintation chain to transfer the validation data" />
      </div>

      {/* Oracle button */}
      {(!isSuccessWriteBlock ||
        !isSuccessWriteInReceipt ||
        isPendingOracle) && (
        <div className="flex items-center justify-center gap-4">
          <button
            className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
              blocksRemaining != 0 ||
              chainId != blockchains[moveNumber % 2] ||
              isPendingOracle ||
              isSuccessWriteBlock ||
              isSuccessWriteInReceipt ||
              switchChainIsPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#F6851B] hover:bg-[#E2761B]"
            }`}
            onClick={handleOracleCall}
            disabled={
              blocksRemaining != 0 ||
              isPendingOracle ||
              isSuccessWriteBlock ||
              isSuccessWriteInReceipt ||
              switchChainIsPending ||
              chainId != blockchains[moveNumber % 2]
            }
          >
            {isPendingOracle ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : (
              "Call Oracle"
            )}
          </button>
          <Tooltip content="Now you can push the validation data to the destination blockchain. Let's go!" />
        </div>
      )}

      {(errorWriteBlock || errorWriteInReceipt || switchChainError) && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error:{" "}
          {errorWriteBlock?.message ||
            errorWriteInReceipt?.message ||
            switchChainError?.message}
        </div>
      )}

      {isPendingOracle && (
        <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Waiting for oracle transactions confirmations...
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {isSuccessWriteBlock && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
            Block number transfer successful!
          </div>
        )}

        {isSuccessWriteInReceipt && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
            Receipt trie root transfer successful!
          </div>
        )}
        {isSuccessWriteBlock && isSuccessWriteInReceipt && !isPendingOracle && (
          <div className="flex items-center justify-center gap-4">
            <button
              className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
              onClick={() => setGameState("TO_CALL_RELAYER")}
            >
              Continue
            </button>
            <Tooltip
              content="The next step is to call the Relayer to push our move to the destination blockchain. Let's go!"
              link={{
                href: "https://docs.axsdasdsadsadelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
