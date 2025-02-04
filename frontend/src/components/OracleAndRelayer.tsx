"use client";
import { useAccount, useBlockNumber, useConfig } from "wagmi";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
  msgReceipt,
  msgRelayer,
} from "../utils/ContractInfo"; //
import React, { useEffect } from "react";
import {
  getBlock,
  getPublicClient,
  getTransactionReceipt,
} from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";
import {
  GameMoveStates,
  GameResultsArray,
  useGame,
} from "@/contexts/GameContext";
import {
  getTrie,
  getProof,
  verifyProof,
  serializeReceipt,
  txTypes,
  txStatus,
} from "@/utils/mpt";
import { RLP as rlp } from "@ethereumjs/rlp";
import { Address, Hex, toHex } from "viem";

export default function OracleAndRelayer() {
  const { chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

  const {
    gameState,
    setGameState,
    setGameId,
    setResult,
    moveBlockNumber,
    moveNumber,
    blockchains,
  } = useGame();

  const config = useConfig();

  const { data: blockNumber } = useBlockNumber({
    watch: true,
  });

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
    console.log("log", log);
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
        newGameState = "TO_CALL_RELAYER";
      }
    }
    setGameState(newGameState as GameMoveStates);
  };

  const handleMoveReceived = async (log: any) => {
    setGameId(Number(log.args.gameId));
  };

  const handleGameResult = async (log: any) => {
    setResult(GameResultsArray[Number(log.args.finishedGame.result) - 1]);
  };

  useEffect(() => {
    const checkBlockForEvents = async () => {
      if (
        blockNumber === undefined ||
        chainId === undefined ||
        chainData[chainId] === undefined ||
        moveBlockNumber === null
      ) {
        return;
      }

      if (chainData[chainId].blockNumber >= blockNumber) {
        return;
      }

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

      const fromBlock = BigInt(
        chainData[chainId].blockNumber > 0
          ? chainData[chainId].blockNumber + 1
          : chainId == blockchains[(moveNumber + 1) % 2]
            ? moveBlockNumber
            : blockNumber
      );

      // Update block number in chain data regardless of events
      dispatch({
        type: "UPDATE_BLOCK_NUMBER",
        chainId: chainId,
        blockNumber: Number(blockNumber),
      });

      console.log(
        "Oracle & Relayer: checking blocks",
        fromBlock,
        "to",
        blockNumber,
        "for events on chain",
        chainId
      );

      const publicClient = getPublicClient(config);
      if (!publicClient) {
        console.error("Public client not found");
        return;
      }
      try {
        // Get all logs from the last read block for the outgoing communication contract
        const logs = await publicClient.getLogs({
          address: [outgoingAddress, incomingAddress, gameAddress],
          events: [
            {
              type: "event",
              name: "OutboundMessage",
              inputs:
                CONTRACT_ABIS["outgoing"].find(
                  (abi) =>
                    abi.type === "event" && abi.name === "OutboundMessage"
                )?.inputs || [],
            },
            {
              type: "event",
              name: "InboundMessagesRes",
              inputs:
                CONTRACT_ABIS["incoming"].find(
                  (abi) =>
                    abi.type === "event" && abi.name === "InboundMessagesRes"
                )?.inputs || [],
            },
            {
              type: "event",
              name: "GameResult",
              inputs:
                CONTRACT_ABIS["game"].find(
                  (abi) => abi.type === "event" && abi.name === "GameResult"
                )?.inputs || [],
            },
            {
              type: "event",
              name: "MoveReceived",
              inputs:
                CONTRACT_ABIS["game"].find(
                  (abi) => abi.type === "event" && abi.name === "MoveReceived"
                )?.inputs || [],
            },
          ],
          fromBlock: fromBlock,
          toBlock: blockNumber,
        });
        // If we found any relevant events, process them
        const Blocks: { [key: number]: any } = {};
        for (const log of logs) {
          // Store receipts only for outbound messages
          if (log.eventName === "OutboundMessage") {
            console.log(log.eventName);
            if (!Blocks[Number(log.blockNumber)]) {
              Blocks[Number(log.blockNumber)] = await getBlock(config, {
                blockNumber: log.blockNumber,
              });
            }
            // Process each log
            dispatch({
              type: "ADD_RECEIPT_TRIE_ROOT",
              chainId: Number(
                (log.args as { destinationBC: number }).destinationBC
              ),
              sourceId: chainId,
              blockNumber: Number(log.blockNumber),
              root: Blocks[Number(log.blockNumber)].receiptsRoot,
            });
            handleEmitMsg(log);
            console.log(log.eventName, "FINISHED");
          }
          if (log.eventName == "InboundMessagesRes") {
            console.log(log.eventName);
            handleMsgDelivered(log);
            console.log(log.eventName, "FINISHED");
          } else if (log.eventName == "GameResult") {
            console.log(log.eventName);
            handleGameResult(log);
            console.log(log.eventName, "FINISHED");
          } else if (log.eventName == "MoveReceived") {
            console.log(log.eventName);
            handleMoveReceived(log);
            console.log(log.eventName, "FINISHED");
          }
        }
      } catch (error) {
        console.error("Error checking block for events:", error);
      }
    };
    checkBlockForEvents();
  }, [blockNumber, chainId]);

  return <></>;
}
