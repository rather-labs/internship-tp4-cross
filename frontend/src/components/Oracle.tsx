"use client";
import {
  useAccount,
  useBlockNumber,
  useConfig,
  useWatchContractEvent,
} from "wagmi";
import {
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  CHAIN_NAMES,
} from "../utils/ContractInfo"; //
import React, { useEffect } from "react";
import { Address } from "viem";
import { getBlock } from "wagmi/actions";
import { useChainData } from "../contexts/ChainDataContext";

type ChainAddresses = (typeof CONTRACT_ADDRESSES)["outgoing"];

export default function Oracle() {
  const { isConnected, chainId } = useAccount();

  const { state: chainData, dispatch } = useChainData();

  let config = useConfig();

  const { data: blockNumber } = useBlockNumber({
    watch: true,
  });

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

  return <div className="flex flex-col space-y-4"></div>;
}
