import { useEffect, RefObject } from 'react'
import { GameState } from './useGameState'
import { randomBetween } from '@/lib/game/utils'
import { DIFFICULTY_SETTINGS } from '@/lib/game/difficulty'

interface Level {
  number: number
  name: string
  targetScore: number
  asteroidSpeed: number
  spawnRate: number
  asteroidCount: number
}

export function useAsteroidSpawning(
  gameStateRef: RefObject<GameState>,
  gameStarted: boolean,
  level: Level
) {
  useEffect(() => {
    if (!gameStarted || !gameStateRef.current) return

    const diffSettings = DIFFICULTY_SETTINGS[gameStateRef.current.difficulty]

    const spawnInterval = setInterval(() => {
      if (!gameStateRef.current) return

      const adjustedAsteroidCount = Math.floor(level.asteroidCount * diffSettings.asteroidCountMultiplier)

      if (gameStateRef.current.gameOver || gameStateRef.current.isPaused ||
        gameStateRef.current.asteroids.length >= adjustedAsteroidCount) return

      const size = randomBetween(diffSettings.asteroidSizeMin, diffSettings.asteroidSizeMax)
      const edge = Math.floor(randomBetween(0, 4))
      let x, y

      if (edge === 0) { x = -size; y = Math.random() * 600 }
      else if (edge === 1) { x = 800 + size; y = Math.random() * 600 }
      else if (edge === 2) { y = -size; x = Math.random() * 800 }
      else { y = 600 + size; x = Math.random() * 800 }

      const adjustedSpeed = level.asteroidSpeed * diffSettings.asteroidSpeedMultiplier

      gameStateRef.current.asteroids.push({
        x, y, width: size, height: size, size,
        vx: randomBetween(-adjustedSpeed, adjustedSpeed),
        vy: randomBetween(-adjustedSpeed, adjustedSpeed)
      })
    }, level.spawnRate)

    return () => clearInterval(spawnInterval)
  }, [gameStarted, gameStateRef, level])
}