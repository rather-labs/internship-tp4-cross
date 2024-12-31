export function Transition({ handleNextTurn, currentPlayer }: { handleNextTurn: () => void, currentPlayer: number }) {

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8">
        Player {currentPlayer} chose their move! The move has been sent to
        the cross-chain protocol.
      </h2>
      <div className="bg-[#037DD6] text-white p-6 rounded-xl mb-8">
        <p className="text-xl mb-4">
          Now it's Player {currentPlayer === 1 ? 2 : 1}'s turn
        </p>
        <p className="text-sm text-gray-200">
          The previous move has been securely stored
        </p>
      </div>
      <button
        className="bg-[#F6851B] hover:bg-[#E2761B] px-8 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-lg text-white"
        onClick={handleNextTurn}
      >
        Start Player {currentPlayer === 1 ? 2 : 1}'s Turn
      </button>
    </div>
  );
}
