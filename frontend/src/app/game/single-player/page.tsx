"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { CallOracle } from "@/components/CallOracle";
import { Transition } from "@/components/Transition";
import { MoveSelection } from "@/components/MoveSelection";
import { Header } from "@/components/Header";
import { useGame } from "@/contexts/GameContext";
import { CallRelayer } from "@/components/CallRelayer";
import { SpeedSelection } from "@/components/SpeedSelection";
import { RestartGame } from "@/components/RestartGame";
import { ShowResult } from "@/components/ShowResult";
import { BetSelection } from "@/components/BetSelection";

export default function SinglePlayerGame() {
  const router = useRouter();
  const account = useAccount();
  const { finalitySpeed, gameState, players, bets } = useGame();

  // Redirect if not connected
  useEffect(() => {
    if (account.status !== "connected" && !account.isConnecting) {
      router.push("/");
    }
  }, [account.status, router]);

  const renderGameContent = () => {
    if (
      !account.isConnecting &&
      players[0] &&
      account.address != players[0] &&
      account.address != players[1]
    ) {
      return <RestartGame />;
    }

    if (gameState === "WAITING_ORACLE" || gameState === "ORACLE_FINISHED") {
      return <CallOracle />;
    }
    if (gameState === "WAITING_RELAYER" || gameState === "RELAYER_FINISHED") {
      return <CallRelayer />;
    }
    if (gameState === "TRANSITION" || gameState === "FINISHED") {
      return <Transition />;
    }

    if (!finalitySpeed) {
      return <SpeedSelection />;
    }

    if (bets[0] < 0) {
      return <BetSelection />;
    }

    if (gameState === "WAITING_RESULT") {
      return <ShowResult />;
    }

    return (
      <>
        <MoveSelection />
      </>
    );
  };

  try {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#24272A]">
        <Toaster />
        {/* Header */}
        <Header />

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
