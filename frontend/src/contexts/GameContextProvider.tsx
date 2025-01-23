import { useState, ReactNode, useEffect } from "react";
import { getData, storeData } from "../utils/StoreData";
import { GameContext, GameResults, StoredGameState } from "./GameContext";
import { GameMoveStates } from "./GameContext";

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
  player1Move: 0,
  player1Nonce: 0,
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
  const [player1Move, setPlayer1Move] = useState(storedState.player1Move);
  const [player1Nonce, setPlayer1Nonce] = useState(storedState.player1Nonce);

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
    setPlayer1Move(initialState.player1Move);
    setPlayer1Nonce(initialState.player1Nonce);
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
      player1Move,
      player1Nonce,
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
    player1Move,
    player1Nonce,
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
        player1Move,
        setPlayer1Move,
        player1Nonce,
        setPlayer1Nonce,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
