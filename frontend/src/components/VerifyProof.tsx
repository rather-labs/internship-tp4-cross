import { useState } from "react";
import { useGame } from "../contexts/GameContext";
import { noir_return_value_to_hex, verifyProof } from "../utils/noir";
import { ProofData } from "@aztec/bb.js";
import { InputValue } from "@noir-lang/noirc_abi";
import toast from "react-hot-toast";

export function VerifyProof() {
  const [verifying, setVerifying] = useState(false);

  const { setGameState, currentPlayer, proof, player1MoveHash, gameId } =
    useGame();

  const handleVerifyProof = async () => {
    setVerifying(true);
    const hash = noir_return_value_to_hex(proof?.publicInputs as InputValue);
    if (hash !== player1MoveHash) {
      setVerifying(false);
      toast.error(
        "Proof submitted doesn't correspond to player 1's move for game " +
          gameId
      );
      return;
    }
    const verified = await verifyProof(proof as ProofData);
    setVerifying(false);
    if (verified) {
      setGameState("PLAYING");
    }
  };

  if (player1MoveHash === "") {
    return (
      <div className="flex flex-col space-y-8 items-center justify-center">
        <h2 className="text-3xl font-bold mb-8">Waiting...</h2>

        <p className="text-m text-gray-600">
          Waiting for the game contract to emit the hashed value of player 1's
          move
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 items-center justify-center">
      <h2 className="text-3xl font-bold mb-8">Verify proof</h2>
      <>
        <p className="text-m text-gray-600">
          Player {currentPlayer} should verify the proof provided by player
          {currentPlayer === 1 ? " 2" : " 1"} before commiting it's own play and
          bet.
        </p>
      </>
      <button
        className={`px-8 py-4 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
          verifying
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#F6851B] hover:bg-[#E2761B]"
        }`}
        onClick={handleVerifyProof}
        disabled={verifying || proof === null}
      >
        {verifying ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : (
          "Verify"
        )}
      </button>
    </div>
  );
}
