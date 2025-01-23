import { msgRelayer, SUPPORTED_CHAINS } from "../utils/ContractInfo";
import { createContext, useContext } from "react";

type ChainDataAction =
  | {
      type: "ADD_MESSAGE";
      chainId: number;
      message: msgRelayer;
      index: number;
    }
  | {
      type: "APPEND_MESSAGE";
      chainId: number;
      message: msgRelayer;
    }
  | {
      type: "REMOVE_MESSAGE";
      chainId: number;
      messageNumber: number;
      destinationBC: number;
    }
  | {
      type: "UPDATE_BLOCK_NUMBER";
      chainId: number;
      blockNumber: number;
    }
  | {
      type: "ADD_RECEIPT_TRIE_ROOT";
      chainId: number;
      sourceId: number;
      blockNumber: number;
      root: string;
    }
  | {
      type: "REMOVE_RECEIPT_TRIE_ROOT";
      chainId: number;
      sourceId: number;
      blockNumber: number;
    }
  | { type: "RESET" };

export function chainDataReducer(
  state: ChainDataState,
  action: ChainDataAction
): ChainDataState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          outgoingMsgs: [
            ...(state[action.chainId]?.outgoingMsgs || []).slice(
              0,
              action.index
            ),
            action.message,
            ...(state[action.chainId]?.outgoingMsgs || []).slice(action.index),
          ],
        },
      };

    case "APPEND_MESSAGE":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          outgoingMsgs: [
            ...(state[action.chainId]?.outgoingMsgs || []),
            action.message,
          ],
        },
      };

    case "REMOVE_MESSAGE":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          outgoingMsgs:
            state[action.chainId]?.outgoingMsgs.filter(
              (msg) =>
                !(
                  msg.number === action.messageNumber &&
                  msg.destinationBC === action.destinationBC
                )
            ) || [],
        },
      };

    case "UPDATE_BLOCK_NUMBER":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          blockNumber: action.blockNumber,
        },
      };

    case "ADD_RECEIPT_TRIE_ROOT":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          receiptTrieRoots: [
            ...(state[action.chainId]?.receiptTrieRoots || []),
            [action.sourceId, action.blockNumber, action.root],
          ],
        },
      };

    case "REMOVE_RECEIPT_TRIE_ROOT":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          receiptTrieRoots:
            state[action.chainId]?.receiptTrieRoots.filter(
              ([sourceId, blockNum]) =>
                sourceId !== action.sourceId || blockNum !== action.blockNumber
            ) || [],
        },
      };

    case "RESET":
      return chainDataInitialState;

    default:
      return state;
  }
}

interface ChainData {
  outgoingMsgs: msgRelayer[];
  receiptTrieRoots: [number, number, string][];
  blockNumber: number;
}

interface ChainDataState {
  [chainId: number]: ChainData;
}

export const ChainDataContext = createContext<{
  state: ChainDataState;
  dispatch: React.Dispatch<ChainDataAction>;
} | null>(null);

const initialChainData: ChainData = {
  outgoingMsgs: [],
  receiptTrieRoots: [],
  blockNumber: 0,
};

export const chainDataInitialState: ChainDataState = {};
for (const chainId of SUPPORTED_CHAINS) {
  chainDataInitialState[chainId] = initialChainData;
}

export function useChainData() {
  const context = useContext(ChainDataContext);
  if (!context) {
    throw new Error("useChainData must be used within a ChainDataProvider");
  }

  return {
    ...context,
  };
}
