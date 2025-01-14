"use client";

import { useAccount, useConfig, useDisconnect, useWriteContract } from "wagmi";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { CallOracle } from "@/components/CallOracle";
import { Transition } from "@/components/Transition";
import { Game } from "@/components/Game";
import { Header } from "@/components/Header";
import { GameProvider } from "@/contexts/GameContext";
import { useGame } from "@/contexts/GameContext";
import {
  CONTRACT_ADDRESSES,
  CHAIN_IDS,
  CONTRACT_ABIS,
  BLOCKS_FOR_FINALITY,
  CHAIN_NAMES,
} from "@/utils/ContractInfo";
import { writeContract } from "@wagmi/core";
import { waitForTransactionReceipt } from "wagmi/actions";
import { Tooltip } from "@/components/Tooltip";
import { CallRelayer } from "@/components/CallRelayer";

const moveToNumber: { [key: string]: number } = {
  Rock: 1,
  Paper: 2,
  Scissors: 3,
};

function SinglePlayerGame() {
  const router = useRouter();
  const account = useAccount();
  let config = useConfig();
  const { disconnect } = useDisconnect();
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [gameState, setGameState] = useState<
    "WAITING" | "PLAYING" | "TRANSITION"
  >("WAITING");
  const [lastMove, setLastMove] = useState<string | null>(null);
  const chainId = account.chainId;
  const {
    isOracleCalled,
    setCurrentChoice,
    currentChoice,
    finalitySpeed,
    setFinalitySpeed,
    setBlockChains,
    setMoveNumber,
  } = useGame();

  const [errorGameMove, setErrorGameMove] = useState("");
  const [isPendingGameMove, setPendingGameMove] = useState(false);
  const [isSuccessGameMove, setSuccessGameMove] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (account.status !== "connected") {
      router.push("/");
    }
  }, [account.status, router]);

  const handleFirstMove = async (choice: string) => {
    try {
      // Determine destination chain ID based on current chain
      const destinationChainId =
        chainId === CHAIN_IDS.localhost_1
          ? CHAIN_IDS.localhost_2
          : CHAIN_IDS.localhost_1;
      setErrorGameMove("");
      setPendingGameMove(true);
      setSuccessGameMove(false);
      const txHash = await writeContract(config, {
        address: CONTRACT_ADDRESSES["game"][
          CHAIN_NAMES[
            chainId as keyof typeof CHAIN_NAMES
          ] as keyof (typeof CONTRACT_ADDRESSES)["game"]
        ] as `0x${string}`,
        abi: JSON.parse(CONTRACT_ABIS["game"]),
        functionName: "startGame",
        args: [
          account.address as `0x${string}`, // player2 (in single player, same as player1)
          destinationChainId,
          moveToNumber[choice], // move
          finalitySpeed ? BLOCKS_FOR_FINALITY[finalitySpeed] : 1,
        ],
      });
      await waitForTransactionReceipt(config, {
        hash: txHash,
      });
      setBlockChains([chainId, destinationChainId]);
      setMoveNumber(1);
      setSuccessGameMove(true);
    } catch (error: any) {
      toast.error("Failed to submit move. Please try again.", {
        duration: 5000,
        position: "top-center",
        style: {
          background: "#FEE2E2",
          color: "#991B1B",
          border: "1px solid #F87171",
        },
      });
      setErrorGameMove(error.message);
      console.error("Error submitting move:", error);
    }
    setPendingGameMove(false);
  };

  // Add this effect to handle successful transactions
  useEffect(() => {
    if (isSuccessGameMove) {
      setLastMove(currentChoice);
      setGameState("TRANSITION");
    }
  }, [isSuccessGameMove, currentChoice]);

  const handleNextTurn = () => {
    setCurrentPlayer((current) => (current === 1 ? 2 : 1));
    setGameState("PLAYING");
    setLastMove(null);
  };

  const renderGameContent = () => {
    if (gameState === "TRANSITION") {
      if (!isOracleCalled) {
        return <CallOracle />;
      }
      if (isOracleCalled) {
        return <CallRelayer />;
      }
      return (
        <Transition
          handleNextTurn={handleNextTurn}
          currentPlayer={currentPlayer}
        />
      );
    }

    return (
      <>
        {!finalitySpeed ? (
          <div className="space-y-6">
            <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl">
              <p className="text-xl mb-4">Choose Transaction Finality Speed</p>
              <p className="text-m text-gray-600">
                The first parameter we need to define is the amount of blocks we want to wait to ensure <a href="https://example.com/finality" className="text-blue-500 underline">finality</a>  for the source blockchain. We simplified this down to two choices.
              </p>
              <p className="text-m text-gray-600">
                Fast: Wait less blocks, quicker finality, less confidence
                <br />
                Slow: Wait more blocks, slower finality, more confidence
              </p>
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setFinalitySpeed("FAST")}
                className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
              >
                Fast ⚡
              </button>
              <button
                onClick={() => setFinalitySpeed("SLOW")}
                className="bg-[#6A737D] hover:bg-[#4A5056] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
              >
                Slow 🐢
              </button>
              <Tooltip
                content="The speed configuration determines the number of blocks the oracle will wait until sending the message receipt trie. If we select to wait more blocks we will have to wait longer but we will not risk having a chain reordering event that removes our message from the source chain. The number of blocks for each speed is different for each blockchian and can be consulted on the documentation."
                link={{
                  href: "https://docs.axelar.dev/",
                  text: "Learn More",
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <Game
              currentPlayer={currentPlayer}
              setCurrentChoice={setCurrentChoice}
              handleMove={handleFirstMove}
              disableMove={isPendingGameMove}
            />
            {errorGameMove && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {errorGameMove}
              </div>
            )}
            {isPendingGameMove && (
              <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Please wait until the move transaction is confirmed...
              </div>
            )}
          </>
        )}
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

export default function SinglePlayerGameWithProvider() {
  return (
    <GameProvider>
      <SinglePlayerGame />
    </GameProvider>
  );
}
