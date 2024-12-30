import { Tooltip } from "./Tooltip";

export function Game({ currentPlayer, handleMove }: { currentPlayer: number, handleMove: (choice: string) => void }) {
  return (
    <>
      <h2 className="text-3xl font-bold mb-8">
        Make Your Choice, Player {currentPlayer}
      </h2>

      <div className="grid grid-cols-3 gap-8 mb-8">
        {["Rock", "Paper", "Scissors"].map((choice) => (
          <button
            key={choice}
            className="bg-[#F6851B] hover:bg-[#E2761B] p-8 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
            onClick={() => handleMove(choice)}
          >
            {choice === "Rock" ? "💎" : choice === "Paper" ? "📄" : "✂️"}
            <div className="mt-4">{choice}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <p className="text-[#6A737D] text-lg">
          Once you select your move, you will be prompted to sign a
          transaction with your wallet. Then, your move will be sent
          cross-chain to the other player.
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