import { useGame } from "@/contexts/GameContext";
import OracleButton from "./OracleButton";

export function CallOracle() {
  const { finalitySpeed, moveBlockNumber } = useGame();

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Oracle Setup Required</h2>

      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
          <p className="text-sm text-justify">
            You already signed the transaction for your move. Now the next step we need to do is to call the Oracle. The Oracle is used by the 
            protocol to acquire the necessary information in order to validate on the destination chain the move made on the source chain. 
            To ensure finality, the Oracle will wait a number of blocks for finality before pushing the validation information (Finality Block Number and Receipt Trie) to
            the destination chain. Then it will push the information to the protocol on the destination chian.<br/><br/>
            In this app, we will run the Oracle from the frontend for demonstration purposes. To carry on the Oracle task, 
            we first need to change the network to the destination one, so we can push the validation elements to the protocol on the other chain. Then, when finality has been achieved, we will need to sign a 
            transaction that contains the data of the validation elements to push this information to the protocol. The buttons below  will be available once finality has been achieved.
          </p>
          <p className="text-xl mt-4">Selected Speed: {finalitySpeed}</p>
          <p className="text-xl mb-4">
            {moveBlockNumber !== null
              ? `Starting Block Number: ${moveBlockNumber}`
              : "Waiting for block number..."}
          </p>
        </div>
        <OracleButton />
      </div>
    </div>
  );
}
