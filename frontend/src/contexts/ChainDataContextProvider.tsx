import { getData, storeData } from "../utils/StoreData";
import { useReducer, ReactNode, useEffect } from "react";
import {
  chainUndefinedState,
  chainDataInitialState,
  chainDataReducer,
  ChainDataContext,
} from "./ChainDataContext";

export function ChainDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chainDataReducer, chainUndefinedState);

  // Load initial state from localStorage or initialize if not found
  useEffect(() => {
    const loadInitialState = async () => {
      const loadedState = getData(
        "Rock-Paper-Scissors-chainData",
        chainDataInitialState
      );
      if (loadedState) {
        dispatch({ type: "SET_LOADED_DATA", data: loadedState });
      }
    };

    loadInitialState();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state != chainUndefinedState) {
      storeData("Rock-Paper-Scissors-chainData", state);
    }
  }, [state]);

  return (
    <ChainDataContext.Provider value={{ state, dispatch }}>
      {children}
    </ChainDataContext.Provider>
  );
}
