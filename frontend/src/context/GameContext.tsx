import { createContext, useContext, useState, ReactNode } from 'react'

interface GameContextType {
  isOracleCalled: boolean
  setIsOracleCalled: (value: boolean) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [isOracleCalled, setIsOracleCalled] = useState(false)

  return (
    <GameContext.Provider value={{ isOracleCalled, setIsOracleCalled }}>
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