import { useEffect, RefObject } from 'react'
import { GameState } from './useGameState'
import { randomBetween } from '@/lib/game/utils'

export function usePowerUpSpawning(
  gameStateRef: RefObject<GameState>,
  gameStarted: boolean
) {
  useEffect(() => {
    if (!gameStarted || !gameStateRef.current) return

    const powerUpInterval = setInterval(() => {
      if (!gameStateRef.current) return

      if (gameStateRef.current.gameOver || gameStateRef.current.isPaused ||
        gameStateRef.current.powerUps.length >= 2) return

      const types: Array<'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb'> =
        ['speed', 'multishot', 'bigship', 'shield', 'rapidfire', 'bomb']
      const type = types[Math.floor(Math.random() * types.length)]

      gameStateRef.current.powerUps.push({
        x: randomBetween(50, 750),
        y: -30,
        width: 25,
        height: 25,
        type,
        duration: type === 'bomb' ? 1 : 8000
      })
    }, 10000)

    return () => clearInterval(powerUpInterval)
  }, [gameStarted, gameStateRef])
}