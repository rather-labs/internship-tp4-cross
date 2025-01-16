import { defineChain } from 'viem'
import { http, createConfig, createStorage } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

// Define local hardhat chains
const hardhat1 = defineChain({
  id: 31_339,
  name: 'localhost_1',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8547'] },
  },
})

const hardhat2 = defineChain({
  id: 31_338,
  name: 'localhost_2',
  //nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  nativeCurrency: { name: 'Binance Coin', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8546'] },
  },
})

export function getConfig() {
  return createConfig({
    chains: [hardhat1, hardhat2],
    connectors: [
      metaMask({
        dappMetadata: {
          name: "Rock Paper Scissors",
          url: "https://rockpaperscissors.com",
          iconUrl: "https://rockpaperscissors.com/favicon.ico",
        },
        //logging: {
        //  developerMode: true, // Enables developer mode logs
        //  sdk: true           // Enables SDK-specific logs
        //},
      })
    ],
    transports: {
      [hardhat1.id]: http('http://127.0.0.1:8547', {timeout: 10_000, retryCount: 10}),
      [hardhat2.id]: http('http://127.0.0.1:8546', {timeout: 10_000, retryCount: 10}),
    },
    storage: createStorage({ storage: window.localStorage }), 
    syncConnectedChain: true, 
  })
}
