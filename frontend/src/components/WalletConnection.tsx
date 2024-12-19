'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface WalletConnectionProps {
  getNetworkName: (chainId?: number) => string;
}

export function WalletConnection({ getNetworkName }: WalletConnectionProps) {
  const account = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = account.chainId

  const metamaskConnector = connectors.find(
    (connector) => connector.name === 'MetaMask'
  ) as typeof connectors[number]

  return (
    <div>
      {account.status === 'connected' as const ? (
        <div className="flex flex-col gap-2">
          <button
            className="bg-[#D73847] hover:bg-[#C73847] px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg text-white flex items-center gap-2"
            onClick={() => disconnect()}
          >
            <img 
              src="/metamask-fox.webp" 
              alt="MetaMask" 
              className="w-8 h-8"
            />
            Disconnect
          </button>
          <div className="flex items-center gap-2 text-sm font-light">
            <img 
              src={`/networks/${chainId}.svg`} 
              alt={getNetworkName(chainId)} 
              className="w-6 h-6"
            />
            <span>Network: {getNetworkName(chainId)}</span>
          </div>
        </div>
      ) : (
        metamaskConnector && (
          <button
            className="bg-[#037DD6] hover:bg-[#0260A4] px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => connect({ connector: metamaskConnector })}
            disabled={account.status === 'connected' as const}
          >
            Connect MetaMask
          </button>
        )
      )}
    </div>
  )
} 