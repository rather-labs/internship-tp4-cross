import { useGame } from "@/contexts/GameContext";
import OracleButton from "./OracleButton";
import { Tooltip } from "./Tooltip";
import { BLOCKS_FOR_FINALITY } from "@/utils/ContractInfo";

export function CallOracle() {
  const { finalitySpeed, moveBlockNumber } = useGame();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Oracle Action Required</h2>

      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
          <div className="flex flex-row space-y-4"></div>
          <p className="text-m text-gray-600">
            Great! You've succesfully made your move. <br />
            The next step is to call the Oracle to send validation data for this
            move.
          </p>

          <Tooltip
            content="The Oracle sends validation data for messages between chains. 
                     It waits for a set number of block confirmations
                     to ensure finality, then pushes two key pieces of information to the destination
                     chain: the current block Number and Receipt Trie root for the block in which 
                     the message was included.
                     "
            link={{
              href: "https://docs.axsdasdsadsadelar.dev/",
              text: "Learn More",
            }}
          />

          <p className="text-m text-gray-600">
            For this demonstration, you'll act as the Oracle through your
            browser. <br />
            This involves two steps: <br />
            1. Switch to the destination network to prepare for validation{" "}
            <br />
            2. Once finality is achieved, sign a transaction containing the
            validation data
          </p>

          <Tooltip
            content="In a production environment, the Oracle service would be operated by a trusted
               third party to ensure security and reliability. 
               This third party would be responsible for providing accurate blockchain
               data across networks."
            link={{
              href: "https://docs.axsdasdsadsadelar.dev/",
              text: "Learn More",
            }}
          />

          <div className="flex justify-between items-center mt-6 mb-4">
            <div className="bg-blue-100 p-4 rounded-lg flex-1 mr-4">
              <p className="text-sm text-gray-600 mb-1">Selected Speed</p>
              <p className="text-2xl font-bold text-blue-800">
                {finalitySpeed
                  ? finalitySpeed +
                    " (" +
                    BLOCKS_FOR_FINALITY[
                      finalitySpeed as keyof typeof BLOCKS_FOR_FINALITY
                    ] +
                    " block" +
                    (BLOCKS_FOR_FINALITY[
                      finalitySpeed as keyof typeof BLOCKS_FOR_FINALITY
                    ] > 1
                      ? "s"
                      : "") +
                    ")"
                  : "Not Selected"}
              </p>
            </div>

            <div className="bg-blue-100  p-4 rounded-lg flex-1">
              <p className="text-sm text-gray-600 mb-1">Confirmation Block</p>
              <p className="text-2xl font-bold text-blue-800">
                {moveBlockNumber !== null ? (
                  `#${moveBlockNumber}`
                ) : (
                  <span className="text-yellow-600">Pending...</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <OracleButton />
      </div>
    </div>
  );
}
