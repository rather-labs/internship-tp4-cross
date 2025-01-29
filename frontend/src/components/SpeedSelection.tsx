import { Tooltip } from "./Tooltip";
import { useGame } from "../contexts/GameContext";
import { BLOCKS_FOR_FINALITY } from "../utils/ContractInfo";
export function SpeedSelection() {
  const { setFinalitySpeed } = useGame();

  return (
    <>
      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl">
          <h2 className="text-3xl font-bold mb-8">
            Choose Transaction Finality Speed
          </h2>
          <div className="flex flex-row gap-2 justify-center items-center">
            <div className="flex flex-col gap-2">
              <p className="text-m text-gray-600">
                The first parameter we need to define is the amount of blocks we
                want to wait to ensure finality for the moves of the game. We
                simplified this down to two choices.
              </p>
              <p className="text-m text-gray-600">
                Fast: Wait less blocks, quicker finality, less confidence
                <br />
                Slow: Wait more blocks, slower finality, more confidence
              </p>
            </div>
            <Tooltip
              content="The speed configuration determines the number of blocks the oracle will
               wait until sending the message receipt trie. 
               If you select to wait 
               more blocks, you will have to wait longer but it will reduce the risk of having a
                chain reorganization event that removes our message from the source chain.
                "
              link={{
                href: "https://docs.axelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
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
            content={`The number of blocks for finality in the context of this game is defined
                in a per game manner.
                Fast: ${BLOCKS_FOR_FINALITY.FAST} block${BLOCKS_FOR_FINALITY.FAST > 1 ? "s" : ""} | Slow: ${BLOCKS_FOR_FINALITY.SLOW} block${BLOCKS_FOR_FINALITY.SLOW > 1 ? "s" : ""} `}
          />
        </div>
      </div>
    </>
  );
}
