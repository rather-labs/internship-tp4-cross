"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";

import { ChainDataProvider } from "@/contexts/ChainDataContext";
import { GameProvider } from "@/contexts/GameContext";

import { getConfig } from "@/utils/wagmi";

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
