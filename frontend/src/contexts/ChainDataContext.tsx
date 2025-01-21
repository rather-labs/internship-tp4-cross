import { msgRelayer, SUPPORTED_CHAINS } from "@/utils/ContractInfo";
import { getData, storeData } from "@/utils/StoreData";
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";

interface ChainData {
  outgoingMsgs: msgRelayer[];
  receiptTrieRoots: [number, number, string][];
  blockNumber: number;
}

const initialChainData: ChainData = {
  outgoingMsgs: [],
  receiptTrieRoots: [],
  blockNumber: 0,
};

export interface ChainDataState {
  [chainId: number]: ChainData;
}

type Action =
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

const initialState: ChainDataState = {};
for (const chainId of SUPPORTED_CHAINS) {
  initialState[chainId] = initialChainData;
}

const ChainDataContext = createContext<{
  state: ChainDataState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function chainDataReducer(
  state: ChainDataState,
  action: Action
): ChainDataState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          outgoingMsgs: [
            ...state[action.chainId]?.outgoingMsgs.slice(0, action.index),
            action.message,
            ...state[action.chainId]?.outgoingMsgs.slice(action.index),
          ],
        },
      };

    case "APPEND_MESSAGE":
      return {
        ...state,
        [action.chainId]: {
          ...state[action.chainId],
          outgoingMsgs: [
            ...state[action.chainId]?.outgoingMsgs,
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
      return initialState;

    default:
      return state;
  }
}

export function ChainDataProvider({ children }: { children: ReactNode }) {
  //const [state, dispatch] = useReducer(chainDataReducer, initialState);
  // Load initial state from localStorage or use default
  const loadedState = getData("Rock-Paper-Scissors-chainData", initialState);
  const [state, dispatch] = useReducer(chainDataReducer, loadedState);

  // Save to localStorage whenever state changes
  useEffect(() => {
    storeData("Rock-Paper-Scissors-chainData", state);
  }, [state]);

  return (
    <ChainDataContext.Provider value={{ state, dispatch }}>
      {children}
    </ChainDataContext.Provider>
  );
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
