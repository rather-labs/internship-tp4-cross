"use client";
import {
  useAccount,
  useWriteContract,
  useConfig,
  useWatchContractEvent,
} from "wagmi";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  SUPPORTED_CHAINS,
  msgRelayer,
} from "../utils/ContractInfo"; //
import React, { useState } from "react";
import { Address, TransactionReceipt, toHex } from "viem";
import { getBlock, getTransactionReceipt } from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";
import {
  getTrie,
  getProof,
  verifyProof,
  serializeReceipt,
  txTypes,
  txStatus,
} from "@/utils/mpt";
import { MerklePatriciaTrie } from "@ethereumjs/mpt";
import { RLP as rlp } from "@ethereumjs/rlp";

const GAS_CONFIG = {
  maxFeePerGas: 100000000000n, // 100 gwei
  maxPriorityFeePerGas: 2000000000n, // 2 gwei
};
// Ammount of messages required to fill up bus in the taxi/bus logic (and relay them)
//const BUS_CAPACITY = 10; // not implemented for web demonstration

export default function Relayer() {
  const { address: walletAddress, isConnected, chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

  const [inboundingMsgs, setInboundingMsgs] = useState(false);

  const {
    writeContract,
    error: errorWriteContract,
    isPending: isPendingWriteContract,
    isSuccess: isSuccessWriteContract,
  } = useWriteContract();

  let config = useConfig();

  // Get the correct contract address for the current chain
  const incomingAddress = CONTRACT_ADDRESSES["incoming"][
    CHAIN_NAMES[
      chainId as keyof typeof CHAIN_NAMES
    ] as keyof (typeof CONTRACT_ADDRESSES)["incoming"]
  ] as Address;

  // Get the correct contract address for the current chain
  const outgoingAddress = CONTRACT_ADDRESSES["outgoing"][
    CHAIN_NAMES[
      chainId as keyof typeof CHAIN_NAMES
    ] as keyof (typeof CONTRACT_ADDRESSES)["outgoing"]
  ] as Address;

  // Get receipts and proofs formatted for on-chain contract
  async function getReceiptsAndProofs(messages: msgRelayer[]) {
    // Get all receipt tries from necesary blocks
    const totalReceipts: { [key: number]: TransactionReceipt[] } = {};
    const tries: { [key: number]: MerklePatriciaTrie | undefined } = {};
    for (const msg of messages) {
      if (totalReceipts[msg.blockNumber] == undefined) {
        const Block = await getBlock(config, {
          blockNumber: BigInt(msg.blockNumber),
        });
        totalReceipts[msg.blockNumber] = [];
        for (const txHash of Block.transactions) {
          const receipt = await getTransactionReceipt(config, {
            hash: txHash,
          });
          totalReceipts[msg.blockNumber].push(receipt);
        }
        tries[msg.blockNumber] = await getTrie(totalReceipts[msg.blockNumber]);
      }
    }
    // Set proof and receipts as expected by contract
    const receipts = [];
    const proofs = [];
    const blockNumbers = [];
    for (const msg of messages) {
      const receipt = totalReceipts[msg.blockNumber][msg.txIndex];

      const Logs = [];
      for (const Log of receipt.logs) {
        const Topics = [];
        for (const topic of Log.topics) {
          Topics.push(topic);
        }
        Logs.push([Log.address, Topics, Log.data]);
      }
      const proof = await getProof(tries[msg.blockNumber], msg.txIndex);
      if (!proof) {
        console.error("Inclusion proof not verified for message:", msg.number);
        continue;
      }
      if (
        toHex((await verifyProof(proof as Uint8Array[], msg.txIndex)) ?? 0) !==
        toHex(serializeReceipt(receipt))
      ) {
        console.error("Inclusion proof not verified for message:", msg.number);
        continue;
      }
      receipts.push({
        status: txStatus[receipt.status],
        cumulativeGasUsed: toHex(receipt.cumulativeGasUsed),
        logsBloom: receipt.logsBloom,
        logs: Logs,
        txType: txTypes[receipt.type],
        rlpEncTxIndex: toHex(rlp.encode(msg.txIndex)),
      });
      proofs.push(proof.map((value: any) => toHex(value)));
      blockNumbers.push(BigInt(msg.blockNumber));
    }
    return [receipts, proofs, blockNumbers];
  }

  const handleInboundMsgs = async () => {
    console.log("Relayer: handleInboundMsgs");
    setInboundingMsgs(true);
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
      const [receipts, proofs, blockNumbers] =
        await getReceiptsAndProofs(inboundMsgs);
      console.log("receipts", receipts);
      if (receipts.length == 0) {
        continue;
      }
      try {
        writeContract({
          address: incomingAddress,
          abi: JSON.parse(CONTRACT_ABIS["incoming"]),
          functionName: "inboundMessages",
          args: [
            receipts,
            proofs,
            walletAddress as Address,
            BigInt(chain),
            blockNumbers,
          ],
          //gas: 30000000n, // Explicit gas limit
          //...GAS_CONFIG, // Add gas price configuration
        });
      } catch (error) {
        console.error("Error Inbounding messages:", error);
      }
      setInboundingMsgs(false);
    }
  };

  const handleEmitMsg = (log: any) => {
    console.log("Relayer: handleEmitMsg");
    const outMsg: msgRelayer = {
      blockNumber: Number(log.blockNumber),
      finalityBlock: Number(log.blockNumber) + Number(log.args.finalityNBlocks),
      txIndex: Number(log.transactionIndex),
      fee: Number(log.args.fee),
      destinationBC: Number(log.args.destinationBC),
      number: Number(log.args.messageNumber),
      taxi: log.args.taxi,
    };
    // Insert event ordered by finality block
    let index = chainData[chainId ?? 0].outgoingMsgs.findIndex(
      (msg: msgRelayer) => msg.finalityBlock >= outMsg.finalityBlock
    );
    if (index === -1) {
      dispatch({
        type: "APPEND_MESSAGE",
        chainId: chainId ?? 0,
        message: outMsg,
      });
    } else {
      dispatch({
        type: "ADD_MESSAGE",
        chainId: chainId ?? 0,
        message: outMsg,
        index: index,
      });
    }
  };

  const handleMsgDelivered = async (log: any) => {
    console.log("Relayer: handleMsgDelivered");
    console.log("log", log);
    // Remove delivered messages from chainData
    for (const [index, msgNumber] of log.args.inboundMessageNumbers.entries()) {
      if (log.args.successfullInbound[index]) {
        dispatch({
          type: "REMOVE_MESSAGE",
          chainId: log.args.sourceBC,
          messageNumber: msgNumber,
          destinationBC: chainId ?? 0,
        });
      }
    }
  };

  //check if useWatchContractEvent requires third party rpc's can't be used for tutorial implementation
  useWatchContractEvent({
    address: incomingAddress,
    abi: JSON.parse(CONTRACT_ABIS["incoming"]),
    eventName: "InboundMessagesRes",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      console.log("Received InboundMessagesRes logs:", logs);
      handleMsgDelivered(logs[0]);
    },
  });

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
          disabled={isPendingWriteContract || inboundingMsgs}
        >
          {isPendingWriteContract ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : (
            "Inbound messages that have reached finality"
          )}
        </button>
        {errorWriteContract && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {errorWriteContract.message}
          </div>
        )}
        {isSuccessWriteContract && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded font-bold text-center">
            Transaction successful!
          </div>
        )}
      </div>
    </div>
  );
}
