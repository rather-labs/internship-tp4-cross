import { Tooltip } from "./Tooltip";
import { useGame } from "../contexts/GameContext";
import { useChainData } from "@/contexts/ChainDataContext";

export function RestartGame() {
  const { restartGame, players } = useGame();
  const { dispatch } = useChainData();

  return (
    <>
      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl">
          <div className="flex flex-col justify-center items-center">
            <p className="text-2xl mb-4">
              You are not a player in the current game
            </p>
            <p className="text-xl mb-4">
              To continue current game, switch to the account
            </p>
            <p className="text-1.5xl mb-4 text-gray-600">{players[0]}</p>
          </div>
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => {
                restartGame();
                dispatch({ type: "RESET" }); // clears chain data
              }}
              className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
            >
              Restart Game
            </button>

            <Tooltip
              content="You will start a new game playing against yourself in another chain."
              link={{
                href: "https://docs.axelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
