import { defineChain } from 'viem'
import { http, cookieStorage, createConfig, createStorage, webSocket } from 'wagmi'
import { mainnet, sepolia, hardhat} from 'wagmi/chains'
import { coinbaseWallet, injected, metaMask } from 'wagmi/connectors'


const hardhat2 = /*#__PURE__*/ defineChain({
  id: 31_338,
  name: 'Hardhat2',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8546'] },
  },
})


export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, hardhat, hardhat2],
    connectors: [
      injected(),
      coinbaseWallet(),
      metaMask({
        dappMetadata: {
          name: "Bridge communication dapp",
          url: "https://wagmi.io",
          iconUrl: "https://wagmi.io/favicon.ico",
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,  
    syncConnectedChain: true,
    transports: {
      [mainnet.id]: http(), // Will use the wallet's RPC by default
      [sepolia.id]: http(), // Will use the wallet's RPC by default
      [31337]: http(),
      [31338]: http(),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
