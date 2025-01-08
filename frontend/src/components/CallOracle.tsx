import { useGame } from "@/contexts/GameContext";
import OracleButton from "./OracleButton";

export function CallOracle() {
  const { finalitySpeed, moveBlockNumber } = useGame();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Oracle Setup Required</h2>

      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
          <p className="text-sm">
            The Oracle will push the Finality Block Number and Receipt Trie to
            the destination communication contract. This information will be
            used to verify the authenticity of the incoming message, as well as
            to verify finality. Before calling the Oracle we need to first change the network to the destination one, and then wait the number of blocks for the desired finality.
          </p>
          <p className="text-xl mt-4">Selected Speed: {finalitySpeed}</p>
          <p className="text-xl mb-4">
            {moveBlockNumber !== null
              ? `Block where the move was included: ${moveBlockNumber}`
              : "Waiting for block number..."}
          </p>
        </div>
        <OracleButton />
      </div>
    </div>
  );
}
