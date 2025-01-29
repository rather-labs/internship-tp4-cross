import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getData, storeData } from "@/utils/StoreData";

export type GameMoveStates =
  | "PLAYING"
  | "WAITING_ORACLE"
  | "ORACLE_FINISHED"
  | "WAITING_RELAYER"
  | "RELAYER_FINISHED"
  | "TRANSITION"
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
}

export const GameContext = createContext<GameContextType | undefined>(
  undefined
);

// Add interface for stored state
interface StoredGameState {
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
}

const initialState: StoredGameState = {
  gameId: 0,
  finalitySpeed: null,
  moveBlockNumber: null,
  blockchains: [undefined, undefined],
  players: [undefined, undefined],
  currentPlayer: 1,
  moveNumber: 0,
  bets: [-1, -1],
  gameState: "PLAYING",
  result: null,
};

export function GameProvider({ children }: { children: ReactNode }) {
  // Load initial state from localStorage
  const storedState = getData("Rock-Paper-Scissors-gameState", initialState);

  const [gameId, setGameId] = useState<number>(storedState.gameId);

  const [finalitySpeed, setFinalitySpeed] = useState<"SLOW" | "FAST" | null>(
    storedState.finalitySpeed
  );
  const [moveBlockNumber, setMoveBlockNumber] = useState<number | null>(
    storedState.moveBlockNumber
  );
  const [blockchains, setBlockChains] = useState<(number | undefined)[]>(
    storedState.blockchains
  );
  const [players, setPlayers] = useState<(string | undefined)[]>(
    storedState.players
  );

  const [currentPlayer, setCurrentPlayer] = useState(storedState.currentPlayer);
  const [moveNumber, setMoveNumber] = useState(storedState.moveNumber);
  const [bets, setBets] = useState(storedState.bets);
  const [gameState, setGameState] = useState<GameMoveStates>(
    storedState.gameState
  );
  const [result, setResult] = useState<GameResults>(storedState.result);

  function restartGame() {
    setGameId(initialState.gameId);
    setFinalitySpeed(initialState.finalitySpeed);
    setMoveBlockNumber(initialState.moveBlockNumber);
    setBlockChains(initialState.blockchains);
    setPlayers(initialState.players);
    setCurrentPlayer(initialState.currentPlayer);
    setMoveNumber(initialState.moveNumber);
    setBets(initialState.bets);
    setGameState(initialState.gameState);
    setResult(initialState.result);
  }

  // Save state changes to localStorage
  useEffect(() => {
    storeData("Rock-Paper-Scissors-gameState", {
      gameId,
      finalitySpeed,
      moveBlockNumber,
      blockchains,
      players,
      currentPlayer,
      moveNumber,
      bets,
      gameState,
      result,
    });
  }, [
    gameId,
    finalitySpeed,
    moveBlockNumber,
    blockchains,
    players,
    currentPlayer,
    moveNumber,
    bets,
    gameState,
    result,
  ]);

  return (
    <GameContext.Provider
      value={{
        gameId,
        setGameId,
        finalitySpeed,
        setFinalitySpeed,
        moveBlockNumber,
        setMoveBlockNumber,
        blockchains,
        setBlockChains,
        players,
        setPlayers,
        currentPlayer,
        setCurrentPlayer,
        moveNumber,
        setMoveNumber,
        bets,
        setBets,
        gameState,
        setGameState,
        restartGame,
        result,
        setResult,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
