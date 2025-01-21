import { Tooltip } from "./Tooltip";
import { useGame } from "../contexts/GameContext";

export function SpeedSelection() {
  const { setFinalitySpeed } = useGame();

  return (
    <>
      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl">
          <p className="text-xl mb-4">Choose Transaction Finality Speed</p>
          <p className="text-m text-gray-600">
            The first parameter we need to define is the amount of blocks we
            want to wait to ensure{" "}
            <a
              href="https://example.com/finality"
              className="text-blue-500 underline"
            >
              finality
            </a>{" "}
            for the source blockchain. We simplified this down to two choices.
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
    </>
  );
}
