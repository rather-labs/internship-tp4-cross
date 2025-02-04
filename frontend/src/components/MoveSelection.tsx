import { Tooltip } from "./Tooltip";
import { useGame } from "../contexts/GameContext";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import {
  BLOCKS_FOR_FINALITY,
  CONTRACT_ABIS,
  CHAIN_COINGECKO_IDS,
  CHAIN_DECIMALS,
} from "@/utils/ContractInfo";
import { SUPPORTED_CHAINS, CHAIN_NAMES, CHAIN_IDS } from "@/utils/ContractInfo";
import toast from "react-hot-toast";
import { useState } from "react";
import { CONTRACT_ADDRESSES } from "@/utils/ContractInfo";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useChainData } from "@/contexts/ChainDataContext";
import { parseUnits } from "viem";
import axios from "axios";

const moveToNumber: { [key: string]: number } = {
  Rock: 1,
  Paper: 2,
  Scissors: 3,
};

export function MoveSelection() {
  const {
    writeContractAsync: writeContract,
    error: errorGameMove,
    isPending: isPendingGameMove,
    isSuccess: isSuccessGameMove,
  } = useWriteContract();

  const [waitingForTxReceipt, setWaitingForTxReceipt] = useState(false);

  const { chainId, address } = useAccount();

  const { dispatch } = useChainData();

  const config = useConfig();

  const {
    gameId,
    finalitySpeed,
    setBlockChains,
    setPlayers,
    setMoveNumber,
    setMoveBlockNumber,
    setGameState,
    moveNumber,
    blockchains,
    setCurrentPlayer,
    currentPlayer,
    bets,
    setBets,
  } = useGame();

  const [selectedChain, setSelectedChain] = useState<number>(
    chainId == SUPPORTED_CHAINS[0] ? SUPPORTED_CHAINS[1] : SUPPORTED_CHAINS[0]
  );

  const fetchPrice = async (tokenChainId: number) => {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: CHAIN_COINGECKO_IDS[
              tokenChainId as keyof typeof CHAIN_COINGECKO_IDS
            ], // Coingecko token ID, e.g., 'ethereum'
            vs_currencies: "usd",
          },
        }
      );
      return response.data[
        CHAIN_COINGECKO_IDS[tokenChainId as keyof typeof CHAIN_COINGECKO_IDS]
      ].usd;
    } catch (error) {
      console.error("Error fetching token price:", error);
    }
  };

  const handleFirstMove = async (choice: string) => {
    try {
      // Determine bet amount for player 2 acording to current conversion rate
      const destinationPrice = await fetchPrice(selectedChain);
      const sourcePrice = await fetchPrice(chainId as number);
      setBets([bets[0], (bets[0] * sourcePrice) / destinationPrice]);
      const txHash = await writeContract({
        address: CONTRACT_ADDRESSES["game"][
          CHAIN_NAMES[
            chainId as keyof typeof CHAIN_NAMES
          ] as keyof (typeof CONTRACT_ADDRESSES)["game"]
        ] as `0x${string}`,
        abi: CONTRACT_ABIS["game"],
        functionName: "startGame",
        args: [
          address as `0x${string}`, // player2 (in single player, same as player1)
          selectedChain,
          moveToNumber[choice], // move
          finalitySpeed ? BLOCKS_FOR_FINALITY[finalitySpeed] : 1,
          parseUnits(
            ((bets[0] * sourcePrice) / destinationPrice).toString(),
            CHAIN_DECIMALS[chainId as keyof typeof CHAIN_DECIMALS]
          ),
        ],
        value: parseUnits(
          bets[0].toString(),
          CHAIN_DECIMALS[chainId as keyof typeof CHAIN_DECIMALS]
        ),
      });

      setWaitingForTxReceipt(true);
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: txHash,
      });
      if (txReceipt.status === "reverted") {
        throw new Error("Transaction Recepit status returned as reverted");
      }
      dispatch({ type: "RESET" }); // clears chain data
      setBlockChains([chainId, selectedChain]);
      setPlayers([address, address]);
      setMoveNumber(1);
      setCurrentPlayer(1);
      setMoveBlockNumber(Number(txReceipt.blockNumber));
      setGameState("WAITING_ORACLE");
    } catch (error: any) {
      toast.error("Failed to start game. Please try again.", {
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

  const handleSecondMove = async (choice: string) => {
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
          moveToNumber[choice], // move
        ],
        value: parseUnits(
          bets[1].toString(),
          CHAIN_DECIMALS[chainId as keyof typeof CHAIN_DECIMALS]
        ),
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
    } catch (error: any) {
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
    <>
      <h2 className="text-3xl font-bold mb-8">
        Make Your Choice, Player {currentPlayer}
      </h2>

      <div className="flex flex-col gap-6 mb-8">
        {moveNumber == 0 && (
          <div className="w-full">
            <p className="mb-2 text-gray-600">
              Select Chain to use as player 2
            </p>
            <select
              className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F6851B] focus:border-transparent"
              onChange={(e) => setSelectedChain(Number(e.target.value))}
              disabled={isPendingGameMove || waitingForTxReceipt}
            >
              {SUPPORTED_CHAINS.filter(
                (destChainId) => destChainId !== chainId
              ).map((destChainId) => (
                <option key={destChainId} value={destChainId}>
                  {CHAIN_NAMES[destChainId as keyof typeof CHAIN_NAMES]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {["Rock", "Paper", "Scissors"].map((choice) => (
            <button
              key={choice}
              className={`bg-[#F6851B] hover:bg-[#E2761B] p-8 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 shadow-lg text-white ${
                isPendingGameMove || waitingForTxReceipt
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() =>
                moveNumber === 0
                  ? handleFirstMove(choice)
                  : handleSecondMove(choice)
              }
              disabled={isPendingGameMove || waitingForTxReceipt}
            >
              {choice === "Rock" ? "💎" : choice === "Paper" ? "📄" : "✂️"}
              <div className="mt-4">{choice}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-m text-gray-600">
          In this step, you play rock-paper-scissors as Player {currentPlayer}.
          <br />
          You now need to select your game move. Once you select your move, you
          will be prompted to sign a transaction with your wallet. Then, your
          move will be transmitted cross-chain.
        </p>
        <Tooltip
          content="We use the cross-chain communication bridge with on chain 
                  inclusion proof verification to safely transmit your move 
                  between blockchains.
                  "
          link={{
            href: "https://docs.axelar.dev/",
            text: "Learn More",
          }}
        />
      </div>

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
    </>
  );
}
