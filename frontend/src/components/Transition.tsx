"use client";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from "next/navigation";

export function Transition() {
  const {
    setMoveNumber,
    setCurrentPlayer,
    setGameState,
    currentPlayer,
    moveNumber,
  } = useGame();

  const router = useRouter();

  if (moveNumber === 3) {
    return (
      <div className="flex flex-col space-y-8 items-center justify-center">
        <h2 className="text-3xl font-bold mb-8">Game Finished!</h2>
        <p className="text-m text-gray-600">
          The result of the game has been succesfully sent to the source
          blockchain.
        </p>
        <button
          className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
          onClick={() => {
            router.push("/");
          }}
        >
          Go back to home page
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 items-center justify-center">
      <h2 className="text-3xl font-bold mb-8">Move Sent!</h2>
      <p className="text-m text-gray-600">
        Player {currentPlayer}'s move{moveNumber === 1 ? "'s hash" : ""} has
        been sent to the game contract in the destination blockchain.
      </p>
      <button
        className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
        onClick={() => {
          setMoveNumber(moveNumber + 1);
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
          setGameState(moveNumber === 1 ? "PLAYING" : "WAITING_REVEAL");
        }}
      >
        {moveNumber === 1 ? "Start Player 2's Turn" : "Reveal Player 1's Move"}
      </button>
    </div>
  );
}
