"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { CHAIN_NAMES, SUPPORTED_CHAINS } from "../utils/ContractInfo";

export function WalletConnection() {
  const { status, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isSuccess } = useSwitchChain();

  useEffect(() => {
    if (chainId) {
      const network = SUPPORTED_CHAINS.indexOf(chainId);
      if (network < 0) {
        const errorMsg = `Network not supported. Please switch to one of: ${SUPPORTED_CHAINS.map(
          (id) => CHAIN_NAMES[id as keyof typeof CHAIN_NAMES]
        ).join(", ")}`;
        toast.error(errorMsg, {
          duration: 5000,
          position: "top-center",
          style: {
            background: "#FEE2E2",
            color: "#991B1B",
            border: "1px solid #F87171",
          },
        });
        disconnect();
      }
    }
  }, [chainId, connect, disconnect, isSuccess]);

  const metamaskConnector = connectors.find(
    (connector) => connector.name === "MetaMask"
  ) as (typeof connectors)[number];

  return (
    <div>
      {status === "connected" ? (
        <div className="flex flex-col gap-2">
          <button
            className="bg-[#D73847] hover:bg-[#C73847] px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg text-white flex items-center gap-2"
            onClick={() => disconnect()}
          >
            <img src="/metamask-fox.webp" alt="MetaMask" className="w-8 h-8" />
            Disconnect
          </button>
          <div className="flex items-center gap-2 text-sm font-light">
            <img
              src={`/networks/${chainId}.svg`}
              alt={CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]}
              className="w-6 h-6"
            />
            <span>
              Network: {CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]}
            </span>
          </div>
        </div>
      ) : (
        metamaskConnector && (
          <button
            className="bg-[#037DD6] hover:bg-[#0260A4] px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => connect({ connector: metamaskConnector })}
            disabled={isConnected || isPending}
          >
            Please Connect Wallet
          </button>
        )
      )}
    </div>
  );
}
