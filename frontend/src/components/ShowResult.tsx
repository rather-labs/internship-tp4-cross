import { useGame } from "@/contexts/GameContext";

export function ShowResult() {
  const { setGameState, currentPlayer, result } = useGame();

  if (result === null) {
    return (
      <div className="flex flex-col space-y-8 items-center justify-center">
        <h2 className="text-3xl font-bold mb-8">Waiting...</h2>

        <p className="text-m text-gray-600">
          Waiting for the game contract to emit the game result
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col space-y-8 items-center justify-center">
      <h2 className="text-3xl font-bold mb-8">{result}</h2>
      <>
        <p className="text-m text-gray-600">
          Player {currentPlayer}'s move has resolved the game.
        </p>
        <p className="text-m text-gray-600">
          This information has to be sent to Player
          {currentPlayer === 1 ? " 2" : " 1"}'s blockchain.
        </p>
      </>
      <button
        className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
        onClick={() => {
          setGameState("WAITING_ORACLE");
        }}
      >
        Continue
      </button>
    </div>
  );
}
