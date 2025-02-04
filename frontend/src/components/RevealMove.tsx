import { useGame } from "../contexts/GameContext";
import {
  CHAIN_NAMES,
  CONTRACT_ABIS,
  CONTRACT_ADDRESSES,
  gameMoveIndexes,
} from "../utils/ContractInfo";
import { useState } from "react";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import toast from "react-hot-toast";

export function RevealMove() {
  const {
    writeContractAsync: writeContract,
    error: errorGameMove,
    isPending: isPendingGameMove,
  } = useWriteContract();

  const [waitingForTxReceipt, setWaitingForTxReceipt] = useState(false);

  const { chainId } = useAccount();

  const config = useConfig();

  const {
    setGameState,
    currentPlayer,
    player1Move,
    player1Nonce,
    gameId,
    blockchains,
    setMoveBlockNumber,
  } = useGame();

  const handleRevealMove = async () => {
    try {
      const txHash = await writeContract({
        address: CONTRACT_ADDRESSES["game"][
          CHAIN_NAMES[
            chainId as keyof typeof CHAIN_NAMES
          ] as keyof (typeof CONTRACT_ADDRESSES)["game"]
        ] as `0x${string}`,
        abi: CONTRACT_ABIS["game"],
        functionName: "submitMove",
        args: [
          gameId as number,
          blockchains[0] as number,
          player1Move,
          player1Nonce,
        ],
      });

      setWaitingForTxReceipt(true);
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      });
      if (txReceipt.status === "reverted") {
        throw new Error("Transaction Recepit status returned as reverted");
      }
      setMoveBlockNumber(Number(txReceipt.blockNumber));
      setGameState("WAITING_RESULT");
    } catch (error) {
      toast.error("Failed to submit move. Please try again.", {
        duration: 5000,
        position: "top-center",
        style: {
          background: "#FEE2E2",
          color: "#991B1B",
          border: "1px solid #F87171",
        },
      });
      console.error("Error submitting move:", error);
    }
    setWaitingForTxReceipt(false);
  };

  return (
    <div className="flex flex-col space-y-8 items-center justify-center">
      <h2 className="text-3xl font-bold mb-8">Reveal Move</h2>
      <p className="text-m text-gray-600">
        Player {currentPlayer} has to show move and nonce to the contract to
        resolve the game.
      </p>
      <div className="flex flex-row justify-between items-center mt-6 mb-4 w-full">
        <div className="bg-[#4260d0] p-4 rounded-lg flex-1 mr-4">
          <p className="text-sm text-white mb-1">Move</p>
          <p className="text-2xl font-bold text-white">
            {gameMoveIndexes[player1Move - 1]}
          </p>
        </div>
        <div className="bg-[#4260d0] p-4 rounded-lg flex-1">
          <p className="text-sm text-white mb-1">Nonce</p>
          <p className="text-2xl font-bold text-white">{player1Nonce}</p>
        </div>
      </div>
      <button
        className={`px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
          isPendingGameMove || waitingForTxReceipt
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#F6851B] hover:bg-[#E2761B]"
        }`}
        onClick={handleRevealMove}
        disabled={isPendingGameMove || waitingForTxReceipt}
      >
        {isPendingGameMove || waitingForTxReceipt ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : (
          "Submit Move"
        )}
      </button>
      {errorGameMove && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {errorGameMove.message}
        </div>
      )}
      {(isPendingGameMove || waitingForTxReceipt) && (
        <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Please wait until the move transaction is confirmed...
        </div>
      )}
    </div>
  );
}
