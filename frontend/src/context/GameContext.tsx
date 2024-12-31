import { createContext, useContext, useState, ReactNode } from 'react'

interface GameContextType {
  isOracleCalled: boolean
  setIsOracleCalled: (value: boolean) => void
  currentChoice: string | null
  setCurrentChoice: (choice: string) => void
  finalitySpeed: 'SLOW' | 'FAST' | null
  setFinalitySpeed: (speed: 'SLOW' | 'FAST') => void
  moveBlockNumber: number | null
  setMoveBlockNumber: (blockNumber: number) => void
}

export const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [isOracleCalled, setIsOracleCalled] = useState(false)
  const [currentChoice, setCurrentChoice] = useState<string | null>(null)
  const [finalitySpeed, setFinalitySpeed] = useState<'SLOW' | 'FAST' | null>(null)
  const [moveBlockNumber, setMoveBlockNumber] = useState<number | null>(null)

  return (
    <GameContext.Provider value={{ 
      isOracleCalled, 
      setIsOracleCalled,
      currentChoice,
      setCurrentChoice,
      finalitySpeed,
      setFinalitySpeed,
      moveBlockNumber,
      setMoveBlockNumber
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
} 