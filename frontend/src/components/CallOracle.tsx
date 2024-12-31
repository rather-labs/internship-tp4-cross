import { useGame } from '@/context/GameContext'
import { OracleButton } from './OracleButton'
import { Tooltip } from './Tooltip'

export function CallOracle() {
  const { finalitySpeed, setFinalitySpeed, moveBlockNumber } = useGame();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">
        Oracle Setup Required
      </h2>
      
      {!finalitySpeed ? (
        <div className="space-y-6">
          <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl">
            <p className="text-xl mb-4">
              Choose Transaction Finality Speed
            </p>
            <p className="text-sm text-gray-600">
              Fast: Wait less blocks, quicker finality, less confidence<br/>
              Slow: Wait more, slower finality, more confidence
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setFinalitySpeed('FAST')}
              className="bg-[#037DD6] hover:bg-[#0260A4] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
            >
              Fast ⚡
            </button>
            <button
              onClick={() => setFinalitySpeed('SLOW')}
              className="bg-[#6A737D] hover:bg-[#4A5056] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
            >
              Slow 🐢
            </button>
            <Tooltip
              content="The speed configuration determines the number of blocks the oracle will wait until sending the message receipt trie. If we select to wait more blocks we will have to wait longer but we will not risk having a chain reordering event that removes our message from the source chain."
              link={{
                href: "https://docs.axelar.dev/",
                text: "Learn More",
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
            <p className="text-sm">
              The Oracle will push the Finality Block Number and Receipt Trie to the destination communication contract. This information will be used to verify the authenticity of the incoming message, as well as to verify finality.
            </p>
            <p className="text-xl mb-4">
              Selected Speed: {finalitySpeed}
            </p>
            <p className="text-xl mb-4">
              {moveBlockNumber !== null 
                ? `Block where the move was included: ${moveBlockNumber}` 
                : 'Waiting for block number...'}
            </p>

          </div>
          <OracleButton />  
        </div>
      )}
    </div>
  )
}