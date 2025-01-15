"use client";
import { useAccount, useBlockNumber, useConfig, useSwitchChain } from "wagmi";
import { writeContract } from "@wagmi/core";
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
    chains,
    switchChainAsync: switchChain,
    error: switchChainError,
    isPending: switchChainIsPending,
    isSuccess: switchChainIsSuccess,
  } = useSwitchChain({ config });

  const [errorWriteBlock, setErrorWriteBlock] = useState("");
  const [isPendingWriteBlock, setPendingWriteBlock] = useState(false);
  const [isSuccessWriteBlock, setSuccessWriteBlock] = useState(false);

  const [errorWriteInReceipt, setErrorWriteInReceipt] = useState("");
  const [isPendingWriteInReceipt, setPendingWriteInReceipt] = useState(false);
  const [isSuccessWriteInReceipt, setSuccessWriteInReceipt] = useState(false);

  const { data: blockNumber } = useBlockNumber({
    watch: true,
  });

  const { state: chainData, dispatch } = useChainData();

  const {
    setIsOracleCalled,
    finalitySpeed,
    moveBlockNumber,
    blockchains,
    moveNumber,
  } = useGame();
  const [blocksRemaining, setBlocksRemaining] = useState<number>(1e10);

  // Get the correct contract address for the current chain
  const verificationAddress = CONTRACT_ADDRESSES["verification"][
    CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] as keyof ChainAddresses
  ] as Address;
  useEffect(() => {
    if (
      blockNumber === undefined ||
      chainId === undefined ||
      chainId == blockchains[moveNumber % 2]
    ) {
      return;
    }
    if (moveBlockNumber) {
      const remaining = Math.max(
        0,
        (finalitySpeed ? BLOCKS_FOR_FINALITY[finalitySpeed] : 0) +
          Number(moveBlockNumber) -
          Number(blockNumber)
      );
      setBlocksRemaining(remaining);
    }
  }, [blockNumber, moveBlockNumber, finalitySpeed]);

  const handleInboundBlockNumbers = async () => {
    for (const chain of SUPPORTED_CHAINS) {
      if (chain === chainId || chainData[chain] === undefined) {
        continue;
      }
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
    if (
      chainId === undefined ||
      chainData[chainId] === undefined ||
      chainData[chainId]?.receiptTrieRoots === undefined
    ) {
      throw new Error("Undefined Chain Id");
    }

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

        const txReceipt = await waitForTransactionReceipt(config, {
          hash: txHash,
        });
        if (txReceipt.status === "reverted") {
          throw new Error("Transaction Recepit status returned as reverted");
        }

        // Remove the sent root
        dispatch({
          type: "REMOVE_RECEIPT_TRIE_ROOT",
          chainId,
          sourceId: receipt[0],
          blockNumber: receipt[1],
        });
        console.log("Contract written successfully");
        setSuccessWriteInReceipt(true);
      } catch (error: any) {
        console.error("Error setting receipt trie root:", error);
        setErrorWriteInReceipt(error.message);
      }
      setPendingWriteInReceipt(false);
    }
  };

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
                ? `Fast mode requires ${BLOCKS_FOR_FINALITY["FAST"]} block confirmations, please wait...`
                : `Slow mode requires ${BLOCKS_FOR_FINALITY["SLOW"]} block confirmations, please wait...`}
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold text-green-600">
            Countdown finished, you can now Switch Network and Call the Oracle
            to submit the information.
          </p>
        )}
      </div>

      {/* Switch Network Button */}
      <div className="flex items-center justify-center gap-4">
        <button
          className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
            switchChainIsPending ||
            chainId == blockchains[moveNumber % 2] ||
            blocksRemaining != 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#F6851B] hover:bg-[#E2761B]"
          }`}
          onClick={async () => {
            console.log("useSwitchChain chains", chains);
            console.log("switchChain Pre", blockchains[moveNumber % 2]);
            await switchChain({ chainId: blockchains[moveNumber % 2] ?? 0 });
            console.log("switchChain Post", blockchains[moveNumber % 2]);
          }}
          disabled={
            switchChainIsPending || chainId == blockchains[moveNumber % 2]
          }
        >
          {switchChainIsPending
            ? "Please Wait..."
            : chainId != blockchains[moveNumber % 2]
              ? `Switch network to: ${blockchains[moveNumber % 2] ?? 0}`
              : "On the right chain to call the Oracle"}
        </button>
        <Tooltip
          content="The next step is to call the Relayer to push our move to the destination blockchain. Let's go!"
          link={{
            href: "https://docs.axsdasdsadsadelar.dev/",
            text: "Learn More",
          }}
        />
      </div>

      {/* Oracle button */}
      {!isSuccessWriteBlock && !isSuccessWriteInReceipt && (
        <div className="flex items-center justify-center gap-4">
          <button
            className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
              blocksRemaining == 0 && switchChainIsSuccess
                ? "bg-[#F6851B] hover:bg-[#E2761B]"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={handleOracleCall}
            disabled={
              blocksRemaining != 0 ||
              isPendingWriteBlock ||
              isPendingWriteInReceipt ||
              switchChainIsPending ||
              !switchChainIsSuccess
            }
          >
            {isPendingWriteBlock || isPendingWriteInReceipt ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : (
              "Call Oracle"
            )}
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

      {(errorWriteBlock || errorWriteInReceipt || switchChainError) && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error:{" "}
          {errorWriteBlock || errorWriteInReceipt || switchChainError?.message}
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
        </div>
      )}
    </div>
  );
}
