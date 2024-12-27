"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";

import { ChainDataProvider } from "../contexts/ChainDataContext";

import { getConfig } from "@/wagmi";
import { cookieToInitialState } from "wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [config] = useState(() => {
    if (typeof window === "undefined") return null; // Return null during SSR
    return getConfig();
  });

  const initialState = cookieToInitialState(getConfig(), document.cookie);
  const [queryClient] = useState(() => new QueryClient());

  if (!config) return null; // Don't render anything during SSR

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ChainDataProvider>{children}</ChainDataProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
