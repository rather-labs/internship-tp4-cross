import { ProofData } from "@aztec/bb.js";
import { createContext, useContext } from "react";

export type GameMoveStates =
  | "PLAYING"
  | "WAITING_ORACLE"
  | "ORACLE_FINISHED"
  | "TO_CALL_RELAYER"
  | "WAITING_RELAYER"
  | "RELAYER_FINISHED"
  | "TRANSITION"
  | "WAITING_PROOF_VERIFICATION"
  | "WAITING_REVEAL"
  | "WAITING_RESULT"
  | "FINISHED";

export type GameResults = null | "Player 1 Wins" | "Player 2 Wins" | "Draw";
export const GameResultsArray: GameResults[] = [
  "Player 1 Wins",
  "Player 2 Wins",
  "Draw",
];

interface GameContextType {
  gameId: number;
  setGameId: (id: number) => void;
  finalitySpeed: "SLOW" | "FAST" | null;
  setFinalitySpeed: (speed: "SLOW" | "FAST") => void;
  moveBlockNumber: number | null;
  setMoveBlockNumber: (blockNumber: number) => void;
  blockchains: (number | undefined)[];
  setBlockChains: (chainIds: (number | undefined)[]) => void;
  players: (string | undefined)[];
  setPlayers: (players: (string | undefined)[]) => void;
  currentPlayer: number;
  setCurrentPlayer: (player: number) => void;
  moveNumber: number;
  setMoveNumber: (value: number) => void;
  bets: number[];
  setBets: (bets: number[]) => void;
  gameState: GameMoveStates;
  setGameState: (state: GameMoveStates) => void;
  restartGame: () => void;
  result: GameResults;
  setResult: (result: GameResults) => void;
  player1Move: number;
  setPlayer1Move: (move: number) => void;
  player1Nonce: number;
  setPlayer1Nonce: (nonce: number) => void;
  player1MoveHash: string;
  setPlayer1MoveHash: (hash: string) => void;
  proof: ProofData | null;
  setProof: (proof: ProofData | null) => void;
}

export const GameContext = createContext<GameContextType | undefined>(
  undefined
);

// Add interface for stored state
export interface StoredGameState {
  gameId: number;
  finalitySpeed: "SLOW" | "FAST" | null;
  moveBlockNumber: number | null;
  blockchains: (number | undefined)[];
  players: (string | undefined)[];
  currentPlayer: number;
  moveNumber: number;
  bets: number[];
  gameState: GameMoveStates;
  result: GameResults;
  player1Move: number;
  player1Nonce: number;
  player1MoveHash: string;
  proof: ProofData | null;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
