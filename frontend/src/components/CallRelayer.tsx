import RelayerButton from "./RelayerButton";

export function CallRelayer() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">Relayer Action Required</h2>

      <div className="space-y-6">
        <div className="border-2 border-gray-300 bg-white shadow-lg p-6 rounded-xl mb-8">
          <p className="text-m text-gray-600">
            The Relayer will push the message to the communication contract
            which will forward it to the destination game contract.
            <br />
            It will also provide the inclusion proof to the verificacion
            contract.
          </p>
        </div>
        <RelayerButton />
      </div>
    </div>
  );
}
