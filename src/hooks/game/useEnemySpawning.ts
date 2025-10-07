import { useEffect, RefObject } from 'react'
import { GameState } from './useGameState'
import { createEnemy } from '@/lib/game/enemies'
import { DIFFICULTY_SETTINGS } from '@/lib/game/difficulty'

const PLAYER_SIZE = 20

export function useEnemySpawning(
  gameStateRef: RefObject<GameState>,
  gameStarted: boolean
) {
  useEffect(() => {
    if (!gameStarted || !gameStateRef.current) return

    const enemySpawnInterval = setInterval(() => {
      if (!gameStateRef.current) return

      if (gameStateRef.current.gameOver || gameStateRef.current.isPaused ||
        gameStateRef.current.enemies.length >= 5) return

      const level = gameStateRef.current.currentLevel
      let enemyType: 'scout' | 'fighter' | 'bomber'

      // More difficult enemies at higher levels
      const rand = Math.random()
      if (level === 1) {
        enemyType = 'scout'
      } else if (level === 2) {
        enemyType = rand < 0.7 ? 'scout' : 'fighter'
      } else if (level === 3) {
        enemyType = rand < 0.4 ? 'scout' : rand < 0.8 ? 'fighter' : 'bomber'
      } else if (level === 4) {
        enemyType = rand < 0.3 ? 'scout' : rand < 0.7 ? 'fighter' : 'bomber'
      } else {
        enemyType = rand < 0.2 ? 'scout' : rand < 0.6 ? 'fighter' : 'bomber'
      }

      const player = gameStateRef.current.player
      const enemy = createEnemy(enemyType, player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2)

      // Apply difficulty multipliers
      const diffSettings = DIFFICULTY_SETTINGS[gameStateRef.current.difficulty]
      enemy.vx *= diffSettings.enemySpeedMultiplier
      enemy.vy *= diffSettings.enemySpeedMultiplier

      gameStateRef.current.enemies.push(enemy)
    }, 8000)

    return () => clearInterval(enemySpawnInterval)
  }, [gameStarted, gameStateRef])
}