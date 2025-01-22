import { Tooltip } from "./Tooltip";
import { useGame } from "../contexts/GameContext";
import { useState } from "react";

export function BetSelection() {
  const { setBets } = useGame();

  const [betAmount, setBetAmount] = useState<string>("");

  const handleAcceptBet = () => {
    setBets([parseFloat(betAmount) || 0, -1]);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl">
          <p className="text-xl mb-4">Choose Bet ammount for the game</p>
          <p className="text-m text-gray-600">
            The bet ammount is the amount of tokens that Player 1 will transfer
            to the contract and will only recover it if the player wins the
            game. Player 2 must bet a specified amount to be able to play the
            game.
          </p>
        </div>

        <div className="flex flex-col justify-center items-center gap-4">
          <div className="flex flex-row gap-4">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter bet amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value ?? "")}
              className="px-4 py-2 border-2 border-gray-300 rounded-xl text-xl focus:outline-none justify-center items-center focus:border-[#037DD6] text-center"
            />
            <Tooltip
              content="Both players must bet the same value of tokens and only the winner will recover the tokens upon game finish. The conversion rates between chains is set on game start, Player 1 defines the expected ammount from Player 2, with information obtained from coingecko's API."
              link={{
                href: "https://docs.axelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
          <button
            onClick={handleAcceptBet}
            className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-2 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
          >
            Accept Bet
          </button>
        </div>
      </div>
    </>
  );
}
