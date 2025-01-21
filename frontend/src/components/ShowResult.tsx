import { useGame } from "@/contexts/GameContext";

export function ShowResult() {
  const { setGameState, currentPlayer, result } = useGame();

  if (result === null) {
    return (
      <div className="flex flex-col space-y-8 items-center justify-center">
        <h2 className="text-3xl font-bold mb-8">
          Waiting for the result of the game...
        </h2>
      </div>
    );
  }
  return (
    <div className="flex flex-col space-y-8 items-center justify-center">
      <h2 className="text-3xl font-bold mb-8">{result}</h2>
      <>
        <p className="text-xl text-[#6A737D] max-w-2xl mx-auto text-justify">
          Player {currentPlayer}'s move has resolved the game.
        </p>
        <p className="text-xl text-[#6A737D] max-w-2xl mx-auto text-justify">
          This information has to be sent to the source blockchain.
        </p>
        <a href={"kk"} className="text-[#037DD6] hover:text-[#0260A4]">
          Learn More
        </a>
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
