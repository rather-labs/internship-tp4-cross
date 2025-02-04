import { defineChain } from 'viem'
import { http, createConfig, createStorage } from 'wagmi'
import { metaMask } from 'wagmi/connectors'
import { bscTestnet, holesky } from 'wagmi/chains'

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
    chains: [hardhat1, hardhat2, bscTestnet, holesky],
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
      [bscTestnet.id]: http('https://bsc-testnet.infura.io/v3/cc3476a2f8a945caa1a9e2119bf55247'), // + import.meta.env.VITE_INFURA_API_KEY),//, {timeout: 10_000, retryCount: 10}),
      [holesky.id]: http('https://holesky.infura.io/v3/cc3476a2f8a945caa1a9e2119bf55247'), // + import.meta.env.VITE_INFURA_API_KEY),//, {timeout: 10_000, retryCount: 10}),
      //[bscTestnet.id]: http('https://eth-holesky.g.alchemy.com/v2/' + import.meta.env.VITE_ALCHEMY_API_KEY),
      //[holesky.id]: http('https://bnb-testnet.g.alchemy.com/v2/' + import.meta.env.VITE_ALCHEMY_API_KEY),
      //[bscTestnet.id]: webSocket('wss://eth-holesky.g.alchemy.com/v2/' + import.meta.env.VITE_ALCHEMY_API_KEY),
      //[holesky.id]: webSocket('wss://bnb-testnet.g.alchemy.com/v2/' + import.meta.env.VITE_ALCHEMY_API_KEY),
    },
    storage: createStorage({ storage: window.localStorage }), 
    syncConnectedChain: true, 
  })
}

