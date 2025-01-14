import { defineChain } from 'viem'
import { http, createConfig } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

// Define local hardhat chains
const hardhat1 = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
})

const hardhat2 = defineChain({
  id: 31338,
  name: 'Localhost2',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8546'] },
    public: { http: ['http://127.0.0.1:8546'] },
  },
})

export function getConfig() {
  return createConfig({
    chains: [hardhat1, hardhat2],
    connectors: [
      metaMask()
    ],
    transports: {
      [hardhat1.id]: http('http://127.0.0.1:8545'),
      [hardhat2.id]: http('http://127.0.0.1:8546'),
    },
  })
}

export function getClient() {
  return getConfig()
}
