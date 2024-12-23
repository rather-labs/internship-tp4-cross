"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { WalletConnection } from "@/components/WalletConnection";
import { Tooltip } from "@/components/Tooltip";

function SinglePlayerGame() {
  const router = useRouter();
  const account = useAccount();
  const { disconnect } = useDisconnect();
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [gameState, setGameState] = useState<
    "WAITING" | "PLAYING" | "TRANSITION"
  >("WAITING");
  const [lastMove, setLastMove] = useState<string | null>(null);
  const chainId = account.chainId;

  // Redirect if not connected
  useEffect(() => {
    if (account.status !== "connected") {
      router.push("/");
    }
  }, [account.status, router]);

  useEffect(() => {
    if (chainId) {
      const network = getAllowedNetworks().find((net) => net.id === chainId);
      if (!network) {
        const errorMsg = `Network not supported. Please switch to one of: ${getAllowedNetworks()
          .map((net) => net.name)
          .join(", ")}`;
        toast.error(errorMsg, {
          duration: 7000,
          position: "top-center",
          style: {
            background: "#FEE2E2",
            color: "#991B1B",
            border: "1px solid #F87171",
          },
        });
        disconnect();
        router.push("/");
      }
    }
  }, [chainId, disconnect, router]);

  const handleMove = (choice: string) => {
    setLastMove(choice);
    setGameState("TRANSITION");
    //TODO: callCommunicationContract()
  };

  const handleNextTurn = () => {
    setCurrentPlayer((current) => (current === 1 ? 2 : 1));
    setGameState("PLAYING");
    setLastMove(null);
  };

  const getAllowedNetworks = () => [
    { id: 1, name: "Ethereum" },
    { id: 17000, name: "Holesky" },
    { id: 11155111, name: "Sepolia" },
    { id: 56, name: "BSC" },
    { id: 97, name: "BSC Testnet" },
    { id: 31337, name: "Localhost" },
    { id: 31338, name: "Localhost2" },
  ];

  const getNetworkName = (chainId?: number) => {
    const network = getAllowedNetworks().find((net) => net.id === chainId);
    return network?.name || "Not Connected";
  };

  const renderGameContent = () => {
    if (gameState === "TRANSITION") {
      return (
        <div className="space-y-8">
          <h2 className="text-3xl font-bold mb-8">
            Player {currentPlayer} chose their move! The move has been sent to
            the cross-chain protocol.
          </h2>
          <div className="bg-[#037DD6] text-white p-6 rounded-xl mb-8">
            <p className="text-xl mb-4">
              Now it's Player {currentPlayer === 1 ? 2 : 1}'s turn
            </p>
            <p className="text-sm text-gray-200">
              The previous move has been securely stored
            </p>
          </div>
          <button
            className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
            onClick={handleNextTurn}
          >
            Start Player {currentPlayer === 1 ? 2 : 1}'s Turn
          </button>
        </div>
      );
    }

    return (
      <>
        <h2 className="text-3xl font-bold mb-8">
          Make Your Choice, Player {currentPlayer}
        </h2>

        <div className="grid grid-cols-3 gap-8 mb-8">
          {["Rock", "Paper", "Scissors"].map((choice) => (
            <button
              key={choice}
              className="bg-[#F6851B] hover:bg-[#E2761B] p-8 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
              onClick={() => handleMove(choice)}
            >
              {choice === "Rock" ? "💎" : choice === "Paper" ? "📄" : "✂️"}
              <div className="mt-4">{choice}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[#6A737D] text-lg">
            Once you select your move, you will be prompted to sign a
            transaction with your wallet. Then, your move will be sent
            cross-chain to the other player.
          </p>
          <Tooltip
            content="We use a secure cross-chain communication protocol to safely transmit your move between different blockchains while maintaining game integrity."
            link={{
              href: "https://docs.axelar.dev/",
              text: "Learn More",
            }}
          />
        </div>
      </>
    );
  };

  try {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#24272A]">
        <Toaster />
        {/* Header */}
        <header className="p-6 flex justify-between items-center bg-white shadow-md">
          <h1 className="text-2xl font-bold text-[#24272A] flex items-center gap-2">
            <img
              src="/rps-icon.webp"
              alt="RPS Game Icon"
              className="w-14 h-14"
            />
            Cross-Chain RPS
          </h1>
          <WalletConnection getNetworkName={getNetworkName} />
        </header>

        {/* Game Area */}
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
              {renderGameContent()}
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-2xl w-full">
          <div className="flex items-center mb-2">
            <div className="text-red-500 text-2xl mr-2">⚠️</div>
            <h3 className="text-red-800 font-bold">Network Error</h3>
          </div>
          <p className="text-red-700">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }
}

export default SinglePlayerGame;
