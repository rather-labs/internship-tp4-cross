"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { WalletConnection } from "@/components/WalletConnection";
import { Tooltip } from "@/components/Tooltip";
import Oracle from "@/components/Oracle";
import Relayer from "@/components/Relayer";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [playerCount, setPlayerCount] = useState<1 | 2 | null>(null);
  const router = useRouter();
  const chainId = account.chainId;

  const metamaskConnector = connectors.find(
    (connector) => connector.name === "MetaMask"
  ) as (typeof connectors)[number];

  const getAllowedNetworks = () => [
    { id: 1, name: "Ethereum" },
    { id: 17000, name: "Holesky" },
    { id: 11155111, name: "Sepolia" },
    { id: 56, name: "BSC" },
    { id: 97, name: "BSC Testnet" },
    { id: 31337, name: "Localhost" },
    { id: 31338, name: "Localhost2" },
  ];

  useEffect(() => {
    if (chainId) {
      const network = getAllowedNetworks().find((net) => net.id === chainId);
      if (!network) {
        const errorMsg = `Network not supported. Please switch to one of: ${getAllowedNetworks()
          .map((net) => net.name)
          .join(", ")}`;
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
  }, [chainId, disconnect]);

  const getNetworkName = (chainId?: number) => {
    const network = getAllowedNetworks().find((net) => net.id === chainId);
    return network?.name || "Not Connected";
  };

  const renderGameButton = () => {
    if (!playerCount) {
      return (
        <div className="space-y-6">
          <div className="flex gap-8 justify-center">
            <button
              className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              onClick={() => setPlayerCount(1)}
            >
              Single Player
            </button>
            <button
              className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              onClick={() => setPlayerCount(2)}
            >
              Two Players
            </button>
          </div>
          <p className="text-[#BBC0C5]">Please select game mode</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {playerCount === 1 ? (
          <div className="ml-6 flex items-center justify-center gap-2">
            <button
              className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
              onClick={() => router.push("/game/single-player")}
            >
              Start Single Player Game
            </button>
            <Tooltip
              content="You will play taking both your turn and the other player's turn, simulating a two-player game. You can also use this for local play with a friend!"
              link={{
                href: "https://docs.axelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
        ) : (
          <div className="ml-6 flex items-center justify-center gap-2">
            <button
              className="bg-[#BBC0C5] px-8 py-4 rounded-xl text-xl font-bold cursor-not-allowed opacity-75"
              disabled={true}
            >
              Two Player Game Coming Soon
            </button>
            <Tooltip
              content="You will play against another player on a different blockchain network. This feature is coming soon!"
              link={{
                href: "https://docs.axelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
        )}
        <button
          className="block mx-auto text-[#BBC0C5] hover:text-[#037DD6] transition-colors"
          onClick={() => setPlayerCount(null)}
        >
          Change Mode
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#24272A]">
      <Toaster />
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white shadow-md">
        <h1 className="text-2xl font-bold text-[#24272A] flex items-center gap-2">
          <img src="/rps-icon.webp" alt="RPS Game Icon" className="w-14 h-14" />
          Cross-Chain RPS
        </h1>
        <Oracle />
        <Relayer />
        <WalletConnection getNetworkName={getNetworkName} />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-5xl font-bold mb-6">
            Play Rock-Paper-Scissors
            <br />
            <span className="text-[#037DD6]">Across Blockchains</span>
          </h2>
          <p className="text-xl text-[#6A737D] mb-8 max-w-2xl mx-auto">
            Challenge players from different blockchain networks in this classic
            game.
          </p>

          {account.status === ("connected" as const) ? (
            renderGameButton()
          ) : (
            <div className="space-y-4">
              <button
                className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => connect({ connector: metamaskConnector })}
                disabled={!metamaskConnector}
              >
                Connect Wallet to Play
              </button>
              <p className="text-[#BBC0C5]">
                Connect your wallet to start playing
              </p>
            </div>
          )}
        </div>

        {/* Game Features */}
        <section className="grid md:grid-cols-2 gap-40">
          {[
            {
              title: "Cross-Chain Protocol Documentation",
              desc: "Learn more about the protocol and how it works",
              link: "https://docs.crosschainrps.com",
            },
            {
              title: "Rock-Paper-Scissors Game Documentation",
              desc: "Learn more about the game, how it works, and how to play",
              link: "https://docs.crosschainrps.com",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{i === 0 ? "⛓️" : "✂️"}</div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-[#6A737D]">{feature.desc}</p>
              <a
                href={feature.link}
                className="text-[#037DD6] hover:text-[#0260A4] transition-colors"
              >
                Learn More
              </a>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
