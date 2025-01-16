"use client";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { writeContract } from "@wagmi/core";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
  msgRelayer,
  msgReceipt,
} from "../utils/ContractInfo"; //
import React, { useState } from "react";
import { Address, Hex } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";

const GAS_CONFIG = {
  maxFeePerGas: 100000000000n, // 100 gwei
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
};
// Ammount of messages required to fill up bus in the taxi/bus logic (and relay them)
//const BUS_CAPACITY = 10; // not implemented for web demonstration

export default function RelayerButton() {
  const { address: walletAddress, isConnected, chainId } = useAccount();

  const { state: chainData } = useChainData();

  const {
    writeContractAsync: writeContractInReceipt,
    error: writeError,
    isPending,
    isSuccess,
  } = useWriteContract();

  const config = useConfig();

  const [inboundingMsgs, setInboundingMsgs] = useState(false);

  // Get the correct contract address for the current chain
  const incomingAddress = CONTRACT_ADDRESSES["incoming"][
    CHAIN_NAMES[
      chainId as keyof typeof CHAIN_NAMES
    ] as keyof (typeof CONTRACT_ADDRESSES)["incoming"]
  ] as Address;

  const handleInboundMsgs = async () => {
    console.log("Relayer: handleInboundMsgs", " | chainId ", chainId);
    for (const chain of SUPPORTED_CHAINS) {
      if (
        chainId === undefined ||
        chainData[chain] === undefined ||
        chainData[chain].outgoingMsgs === undefined
      ) {
        continue;
      }
      const inboundMsgs = chainData[chain].outgoingMsgs.filter(
        (msg: msgRelayer) =>
          msg.destinationBC == chainId &&
          msg.finalityBlock <= chainData[chain].blockNumber
      );
      if (inboundMsgs.length == 0) {
        continue;
      }
      const [receipts, proofs, blockNumbers] = inboundMsgs.reduce(
        (acc, msg) => {
          acc[0].push(msg.receipt),
            acc[1].push(msg.proof),
            acc[2].push(msg.blockNumber);
          return acc;
        },
        [[], [], []] as [msgReceipt[], Hex[][], number[]]
      );
      if (receipts.length == 0) {
        continue;
      }
      try {
        const txHash = await writeContractInReceipt({
          address: incomingAddress,
          abi: JSON.parse(CONTRACT_ABIS["incoming"]),
          functionName: "inboundMessages",
          args: [
            receipts,
            proofs,
            walletAddress as Address,
            chain,
            blockNumbers,
          ],
          //gas: 30000000n, // Explicit gas limit
          //...GAS_CONFIG, // Add gas price configuration
        });
        setInboundingMsgs(true);
        const txReceipt = await waitForTransactionReceipt(config, {
          hash: txHash,
        });
        if (txReceipt.status === "reverted") {
          throw new Error("Transaction Recepit status returned as reverted");
        }
        setInboundingMsgs(false);
      } catch (error: any) {
        console.error("Error Inbounding messages:", error);
      }
    }
  };

  // Only watch for events if we have a valid chainId
  if (!isConnected || !chainId) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div className="p-4 rounded-lg bg-[#ffffff]">
      <div className="flex flex-col space-y-4">
        <button
          className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl text-white font-bold transition-all transform hover:scale-105 shadow-lg"
          onClick={() => handleInboundMsgs()}
          disabled={isPending || inboundingMsgs}
        >
          {isPending || inboundingMsgs ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : (
            "Call Relayer"
          )}
        </button>
        <p className="text-sm text-gray-500">
          This action will manually push the messages that have reached
          finality, as if it was a Relayer.
        </p>
        {writeError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {writeError.message}
          </div>
        )}
        {isSuccess && !inboundingMsgs && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
            Transaction successful!
          </div>
        )}
      </div>
    </div>
  );
}
