import { useGame } from '@/context/GameContext'
import { OracleButton } from './OracleButton'

export function CallOracle() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">
        Oracle Call Required
      </h2>
      <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
        <p className="text-xl mb-4">
          Before the destination contract can receive our cross-chain message, we need to call the Oracle.
        </p>
        <p className="text-sm">
          The Oracle will push the Finality Block Number and Receipt Trie to the destination communication contract. This information will be used to verify the authenticity of the incoming message, as well as to verify finality.
        </p>
      </div>
      <OracleButton />
    </div>
  )
}