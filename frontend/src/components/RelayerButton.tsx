"use client";
import { useAccount, useConfig } from "wagmi";
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
import { Address, Hex, toHex } from "viem";
import {
  getBlock,
  getTransactionReceipt,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";
import {
  getTrie,
  getProof,
  verifyProof,
  serializeReceipt,
  txTypes,
  txStatus,
} from "@/utils/mpt";
import { RLP as rlp } from "@ethereumjs/rlp";

const GAS_CONFIG = {
  maxFeePerGas: 100000000000n, // 100 gwei
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
};
// Ammount of messages required to fill up bus in the taxi/bus logic (and relay them)
//const BUS_CAPACITY = 10; // not implemented for web demonstration

export default function RelayerButton() {
  const { address: walletAddress, isConnected, chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

  let config = useConfig();

  const [writeError, setWriteError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [inboundingMsgs, setInboundingMsgs] = useState(false);

  // Get the correct contract address for the current chain
  const incomingAddress = CONTRACT_ADDRESSES["incoming"][
    CHAIN_NAMES[
      chainId as keyof typeof CHAIN_NAMES
    ] as keyof (typeof CONTRACT_ADDRESSES)["incoming"]
  ] as Address;

  // Get receipts and proofs formatted for on-chain contract
  async function getReceiptAndProof(message: msgRelayer) {
    // Get all receipt tries from necesary blocks
    const Block = await getBlock(config, {
      blockNumber: BigInt(message.blockNumber),
    });
    const totalReceipts = [];
    for (const txHash of Block.transactions) {
      const receipt = await getTransactionReceipt(config, {
        hash: txHash,
      });
      totalReceipts.push(receipt);
    }
    const trie = await getTrie(totalReceipts);

    // Set proof and receipts as expected by contract
    const receipt = totalReceipts[message.txIndex];

    const Logs = [];
    for (const Log of receipt.logs) {
      const Topics = [];
      for (const topic of Log.topics) {
        Topics.push(topic);
      }
      Logs.push([Log.address, Topics, Log.data]);
    }
    const proof = await getProof(trie, message.txIndex);
    if (!proof) {
      console.error(
        "Inclusion proof not verified for message:",
        message.number
      );
      return [undefined, undefined];
    }
    if (
      toHex(
        (await verifyProof(proof as Uint8Array[], message.txIndex)) ?? 0
      ) !== toHex(serializeReceipt(receipt))
    ) {
      console.error(
        "Inclusion proof not verified for message:",
        message.number
      );
      return [undefined, undefined];
    }

    return [
      {
        status: txStatus[receipt.status],
        cumulativeGasUsed: receipt.cumulativeGasUsed,
        logsBloom: receipt.logsBloom,
        logs: Logs,
        txType: txTypes[receipt.type],
        rlpEncTxIndex: toHex(rlp.encode(message.txIndex)),
      } as msgReceipt,
      proof.map((value: any) => toHex(value)),
    ];
  }

  const handleInboundMsgs = async () => {
    console.log("Relayer: handleInboundMsgs");
    setInboundingMsgs(true);
    setWriteError("");
    for (const chain of SUPPORTED_CHAINS) {
      if (
        chainId === undefined ||
        chainData[chain] === undefined ||
        chainData[chain].outgoingMsgs === undefined
      )
        continue;
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
      console.log("receipts", receipts);
      console.log("blockNumbers", blockNumbers);
      if (receipts.length == 0) {
        continue;
      }
      try {
        setIsSuccess(false);
        const txHash = await writeContract(config, {
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
        await waitForTransactionReceipt(config, {
          hash: txHash,
        });
        setIsSuccess(true);
      } catch (error: any) {
        setWriteError(
          writeError + (error.reason ?? error.data?.message ?? error.message)
        );
        console.error("Error Inbounding messages:", error);
      }
      setInboundingMsgs(false);
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
          className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
          onClick={() => handleInboundMsgs()}
          disabled={inboundingMsgs}
        >
          {inboundingMsgs ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : (
            "Inbound messages that have reached finality"
          )}
        </button>
        {writeError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {writeError}
          </div>
        )}
        {isSuccess && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
            Transaction successful!
          </div>
        )}
      </div>
    </div>
  );
}
