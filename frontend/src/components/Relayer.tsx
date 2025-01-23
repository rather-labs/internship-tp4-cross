"use client";
import { useAccount, useConfig, useWatchContractEvent } from "wagmi";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  msgRelayer,
  msgReceipt,
} from "../utils/ContractInfo"; //
import React from "react";
import { Address, Hex, toHex } from "viem";
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
import { RLP as rlp } from "@ethereumjs/rlp";
import {
  GameMoveStates,
  GameResultsArray,
  useGame,
} from "@/contexts/GameContext";

// Ammount of messages required to fill up bus in the taxi/bus logic (and relay them)
//const BUS_CAPACITY = 10; // not implemented for web demonstration

export default function Relayer() {
  const { chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

  const { gameState, setGameState, setGameId, setResult } = useGame();

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

  // Get the correct contract address for the current chain
  const gameAddress = CONTRACT_ADDRESSES["game"][
    CHAIN_NAMES[
      chainId as keyof typeof CHAIN_NAMES
    ] as keyof (typeof CONTRACT_ADDRESSES)["game"]
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

  const handleEmitMsg = async (log: any) => {
    console.log("Relayer: handleEmitMsg", " | chainId ", chainId);
    const outMsg: msgRelayer = {
      blockNumber: Number(log.blockNumber),
      finalityBlock: Number(log.blockNumber) + Number(log.args.finalityNBlocks),
      txIndex: Number(log.transactionIndex),
      fee: Number(log.args.fee),
      destinationBC: Number(log.args.destinationBC),
      number: Number(log.args.messageNumber),
      taxi: log.args.taxi,
      receipt: {} as msgReceipt,
      proof: [] as Hex[],
    };

    const [receipt, proof] = await getReceiptAndProof(outMsg);
    outMsg.receipt = receipt as msgReceipt;
    outMsg.proof = proof as Hex[];

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
    console.log("Relayer: handleMsgDelivered", " | chainId ", chainId);
    console.log("event", log.args);
    if (gameState === "FINISHED") {
      return;
    }
    let newGameState = "RELAYER_FINISHED";
    // Remove delivered messages from chainData
    for (const [index, msgNumber] of log.args.inboundMessageNumbers.entries()) {
      if (
        log.args.successfullInbound[index] ||
        log.args.failureReasons[index] === "Inbound: Message already delivered"
      ) {
        dispatch({
          type: "REMOVE_MESSAGE",
          chainId: Number(log.args.sourceBC),
          messageNumber: Number(msgNumber),
          destinationBC: chainId ?? 0,
        });
      } else {
        newGameState = "WAITING_RELAYER";
      }
    }
    setGameState(newGameState as GameMoveStates);
  };

  const handleMoveReceived = async (log: any) => {
    console.log("Relayer: handleMoveReceived", " | chainId ", chainId);
    setGameId(Number(log.args.gameId));
  };

  const handleGameResult = async (log: any) => {
    console.log("Relayer: handleGameResult", " | chainId ", chainId);
    console.log("event", log.args.finishedGame);
    setResult(GameResultsArray[Number(log.args.finishedGame.result) - 1]);
  };

  //TODO: check if useWatchContractEvent requires third party rpc's can't be used for tutorial implementation
  useWatchContractEvent({
    address: incomingAddress,
    abi: JSON.parse(CONTRACT_ABIS["incoming"]),
    eventName: "InboundMessagesRes",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      handleMsgDelivered(logs[0]);
    },
  });

  useWatchContractEvent({
    address: outgoingAddress,
    abi: JSON.parse(CONTRACT_ABIS["outgoing"]),
    eventName: "OutboundMessage",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      handleEmitMsg(logs[0]);
    },
  });

  useWatchContractEvent({
    address: gameAddress,
    abi: JSON.parse(CONTRACT_ABIS["game"]),
    eventName: "MoveReceived",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      handleMoveReceived(logs[0]);
    },
  });

  useWatchContractEvent({
    address: gameAddress,
    abi: JSON.parse(CONTRACT_ABIS["game"]),
    eventName: "GameResult",
    pollingInterval: 10_000,
    onLogs(logs: any) {
      handleGameResult(logs[0]);
    },
  });

  return <></>;
}
