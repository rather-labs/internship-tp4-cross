"use client";

import { useAccount, useDisconnect, useWriteContract } from "wagmi";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { WalletConnection } from "@/components/WalletConnection";
import { Tooltip } from "@/components/Tooltip";
import { OracleButton } from "@/components/OracleButton";
import { CallOracle } from "@/components/CallOracle";
import { Transition } from "@/components/Transition";
import { Game } from "@/components/Game";
import { Header } from "@/components/Header";
import { GameProvider } from '@/context/GameContext'
import { useGame } from '@/context/GameContext'

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
  const { isOracleCalled } = useGame();

  const {
    writeContract: writeGameMove,
    error: errorGameMove,
    isPending: isPendingGameMove,
    isSuccess: isSuccessGameMove,
  } = useWriteContract();

  // Redirect if not connected
  useEffect(() => {
    if (account.status !== "connected") {
      router.push("/");
    }
  }, [account.status, router]);

  // Check if the network is supported
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

  const handleMove = async (choice: string) => {
    try {
      await writeGameMove({
        address: COMMUNICATION_CONTRACT_ADDRESS as `0x${string}`,
        abi: COMMUNICATION_CONTRACT_ABI,
        functionName: 'sendMessage',
        args: [
          choice,                    // player's move
          currentPlayer,            // current player number
          DESTINATION_CHAIN_ID,     // destination chain ID
          DESTINATION_CONTRACT      // destination contract address
        ],
      });

      if (isSuccessGameMove) {
        setLastMove(choice);
        setGameState("TRANSITION");
      }
    } catch (error) {
      toast.error('Failed to submit move. Please try again.', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #F87171',
        },
      });
      console.error("Error submitting move:", error);
    }
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
      if (!isOracleCalled) {
        return <CallOracle />
      }
      return <Transition handleNextTurn={handleNextTurn} currentPlayer={currentPlayer}/>
    }

    return (
      <>
        <Game currentPlayer={currentPlayer} handleMove={handleMove}/>
        {errorGameMove && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {errorGameMove.message}
          </div>
        )}
        {isPendingGameMove && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            Submitting move to blockchain...
          </div>
        )}
      </>
    )
  };

  try {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#24272A]">
        <Toaster />
        {/* Header */}
        <Header getNetworkName={getNetworkName} />

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

export default function SinglePlayerGameWithProvider() {
  return (
    <GameProvider>
      <SinglePlayerGame />
    </GameProvider>
  );
}
