"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { ChainDataProvider } from "./ChainDataContextProvider";
import { GameProvider } from "./GameContextProvider";

import { getConfig } from "../utils/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={getConfig()}>
      <QueryClientProvider client={queryClient}>
        <ChainDataProvider>
          <GameProvider>{children}</GameProvider>
        </ChainDataProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
