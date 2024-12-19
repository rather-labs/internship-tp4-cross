import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      injected(),
      coinbaseWallet(),
      metaMask({
        dappMetadata: {
          name: "Example Wagmi dapp",
          url: "https://wagmi.io",
          iconUrl: "https://wagmi.io/favicon.ico",
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(process.env.INFURA_ETH_MAINNET),
      [sepolia.id]: http(process.env.INFURA_ETH_SEPOLIA),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
