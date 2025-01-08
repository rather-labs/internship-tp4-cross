import { Tooltip } from "./Tooltip";
import { useGame } from "../contexts/GameContext";
import { useBlockNumber } from "wagmi";

export function Game({
  currentPlayer,
  setCurrentChoice,
  handleMove,
  disableMove,
}: {
  currentPlayer: number;
  setCurrentChoice: (choice: string) => void;
  handleMove: (choice: string) => void;
  disableMove: boolean;
}) {
  const {
    data: blockNumber,
    isError,
    isLoading,
  } = useBlockNumber({
    watch: true,
  });
  const { setMoveBlockNumber } = useGame();

  const handleClick = async (choice: string) => {
    setCurrentChoice(choice);
    try {
      // Get the latest block number directly if the hook hasn't updated
      const latestBlock = blockNumber;
      setMoveBlockNumber(Number(latestBlock));
    } catch (error) {
      console.error("Error getting block number:", error);
    }
    setTimeout(() => {
      handleMove(choice);
    }, 0);
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-8">
        Make Your Choice, Player {currentPlayer}
      </h2>

      <div className="grid grid-cols-3 gap-8 mb-8">
        {["Rock", "Paper", "Scissors"].map((choice) => (
          <button
            key={choice}
            className={`bg-[#F6851B] hover:bg-[#E2761B] p-8 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
              disableMove ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => handleClick(choice)}
            disabled={disableMove}
          >
            {choice === "Rock" ? "💎" : choice === "Paper" ? "📄" : "✂️"}
            <div className="mt-4">{choice}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <p className="text-[#6A737D] text-lg">
          Once you select your move, you will be prompted to sign a transaction
          with your wallet. Then, your move will be sent cross-chain to the
          other player.
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
}
