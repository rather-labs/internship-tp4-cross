import { getData, storeData } from "../utils/StoreData";
import { useReducer, ReactNode, useEffect } from "react";
import {
  chainDataInitialState,
  chainDataReducer,
  ChainDataContext,
} from "./ChainDataContext";

export function ChainDataProvider({ children }: { children: ReactNode }) {
  //const [state, dispatch] = useReducer(chainDataReducer, initialState);
  // Load initial state from localStorage or use default
  const loadedState = getData(
    "Rock-Paper-Scissors-chainData",
    chainDataInitialState
  );
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
