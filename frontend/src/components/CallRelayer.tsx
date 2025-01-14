import RelayerButton from "./RelayerButton";

export function CallRelayer() {

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Relayer Call Required</h2>

      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
          <p className="text-sm">
            The Relayer will push the move to the destination Game Contract, thus executing the game logic on the destination game contract, for player 2's blockchain. Here we will act as a Relayer, manually pushing the message to the destination blockchain.
          </p>
        </div>
        <RelayerButton />
      </div>
    </div>
  );
}
