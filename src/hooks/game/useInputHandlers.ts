// src/hooks/game/useInputHandlers.ts
import { useEffect, RefObject } from 'react'
import { GameState } from './useGameState'
import { soundManager } from '@/lib/game/sounds'
import { ParticleSystem } from '@/lib/game/particles'
import { ScreenShake } from '@/lib/game/screenShake'
import { ENEMY_TYPES } from '@/lib/game/enemies'
import { BOSS_TYPES } from '@/lib/game/bosses'

const PLAYER_SIZE = 20
const BULLET_SPEED = 5
const BULLET_LIFESPAN = 100

interface InputHandlers {
  gameStateRef: RefObject<GameState>
  keysRef: RefObject<Record<string, boolean>>
  mousePosRef: RefObject<{ x: number; y: number }>
  lastShotTimeRef: RefObject<number>
  particleSystemRef: RefObject<ParticleSystem>
  screenShakeRef: RefObject<ScreenShake>
  canvasRef: RefObject<HTMLCanvasElement | null>
  gameStarted: boolean
  gameOver: boolean
  setIsPaused: (paused: boolean) => void
  isMobile?: boolean
  mobileInputRef?: RefObject<{ x: number; y: number }>
}

export function useInputHandlers({
  gameStateRef,
  keysRef,
  mousePosRef,
  lastShotTimeRef,
  particleSystemRef,
  screenShakeRef,
  canvasRef,
  gameStarted,
  gameOver,
  setIsPaused,
  isMobile = false,
  mobileInputRef
}: InputHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStateRef.current || !e || !e.key) return
      
      if (e.key.toLowerCase() === 'p') {
        if (gameStarted && !gameOver) {
          gameStateRef.current.isPaused = !gameStateRef.current.isPaused
          setIsPaused(gameStateRef.current.isPaused)
        }
        return
      }
      
      if (e.key === ' ' && gameStateRef.current.activePowerUps.bomb > 0) {
        e.preventDefault()
        activateBomb()
        return
      }
      
      if (keysRef.current) {
        keysRef.current[e.key.toLowerCase()] = true
      }
    }

    const activateBomb = () => {
      if (!gameStateRef.current) return
      
      // Destroy all asteroids
      gameStateRef.current.asteroids.forEach(a => {
        particleSystemRef.current?.createExplosion(
          a.x + a.size / 2,
          a.y + a.size / 2,
          12,
          'orange'
        )
        gameStateRef.current!.score += Math.floor(a.size)
      })
      gameStateRef.current.asteroids = []
      
      // Destroy all enemies
      gameStateRef.current.enemies.forEach(enemy => {
        particleSystemRef.current?.createExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          12,
          ENEMY_TYPES[enemy.type].color
        )
        gameStateRef.current!.score += ENEMY_TYPES[enemy.type].points
      })
      gameStateRef.current.enemies = []
      gameStateRef.current.enemyBullets = []
      
      // Damage boss if active
      if (gameStateRef.current.boss) {
        gameStateRef.current.boss.health -= 20
        particleSystemRef.current?.createExplosion(
          gameStateRef.current.boss.x + gameStateRef.current.boss.width / 2,
          gameStateRef.current.boss.y + gameStateRef.current.boss.height / 2,
          15,
          BOSS_TYPES[gameStateRef.current.boss.type].color
        )
        if (gameStateRef.current.boss.health <= 0) {
          gameStateRef.current.score += 1000
          gameStateRef.current.boss = null
          gameStateRef.current.bossBullets = []
          gameStateRef.current.bossActive = false
          gameStateRef.current.bossDefeated = true
        }
      }
      
      gameStateRef.current.activePowerUps.bomb = 0
      soundManager.explosion()
      screenShakeRef.current?.trigger(20, 400)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e || !e.key || !keysRef.current) return
      keysRef.current[e.key.toLowerCase()] = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return
      
      if (canvasRef.current && mousePosRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        mousePosRef.current.x = e.clientX - rect.left
        mousePosRef.current.y = e.clientY - rect.top
      }
    }

    const handleShoot = () => {
      if (!gameStateRef.current || gameStateRef.current.gameOver || !gameStarted || gameStateRef.current.isPaused) return
      
      const now = Date.now()
      const fireRate = gameStateRef.current.activePowerUps.rapidfire > 0 ? 100 : 200
      if (now - lastShotTimeRef.current! < fireRate) return
      
      lastShotTimeRef.current! = now
      const p = gameStateRef.current.player
      const speed = gameStateRef.current.activePowerUps.speed > 0 ? BULLET_SPEED * 1.5 : BULLET_SPEED
      const lifeBonus = gameStateRef.current.activePowerUps.rapidfire > 0 ? 1.5 : 1
      
      soundManager.shoot()
      
      if (gameStateRef.current.activePowerUps.multishot > 0) {
        for (let i = -1; i <= 1; i++) {
          const angle = p.rotation + (i * 0.2)
          gameStateRef.current.bullets.push({
            x: p.x + PLAYER_SIZE / 2,
            y: p.y + PLAYER_SIZE / 2,
            width: 4,
            height: 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: BULLET_LIFESPAN * lifeBonus
          })
        }
      } else {
        gameStateRef.current.bullets.push({
          x: p.x + PLAYER_SIZE / 2,
          y: p.y + PLAYER_SIZE / 2,
          width: 4,
          height: 4,
          vx: Math.cos(p.rotation) * speed,
          vy: Math.sin(p.rotation) * speed,
          life: BULLET_LIFESPAN * lifeBonus
        })
      }
    }

    // Desktop controls
    if (!isMobile) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('click', handleShoot)
    } else {
      // Mobile: still need keyboard for pause on tablets
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleShoot)
    }
  }, [gameStarted, gameOver, gameStateRef, keysRef, mousePosRef, lastShotTimeRef, particleSystemRef, screenShakeRef, canvasRef, setIsPaused, isMobile, mobileInputRef])

  // Export shoot function for mobile controls
  return {
    shoot: () => {
      if (!gameStateRef.current || gameStateRef.current.gameOver || !gameStarted || gameStateRef.current.isPaused) return
      
      const now = Date.now()
      const fireRate = gameStateRef.current.activePowerUps.rapidfire > 0 ? 100 : 200
      if (now - lastShotTimeRef.current! < fireRate) return
      
      lastShotTimeRef.current! = now
      const p = gameStateRef.current.player
      const speed = gameStateRef.current.activePowerUps.speed > 0 ? BULLET_SPEED * 1.5 : BULLET_SPEED
      const lifeBonus = gameStateRef.current.activePowerUps.rapidfire > 0 ? 1.5 : 1
      
      soundManager.shoot()
      
      if (gameStateRef.current.activePowerUps.multishot > 0) {
        for (let i = -1; i <= 1; i++) {
          const angle = p.rotation + (i * 0.2)
          gameStateRef.current.bullets.push({
            x: p.x + PLAYER_SIZE / 2,
            y: p.y + PLAYER_SIZE / 2,
            width: 4,
            height: 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: BULLET_LIFESPAN * lifeBonus
          })
        }
      } else {
        gameStateRef.current.bullets.push({
          x: p.x + PLAYER_SIZE / 2,
          y: p.y + PLAYER_SIZE / 2,
          width: 4,
          height: 4,
          vx: Math.cos(p.rotation) * speed,
          vy: Math.sin(p.rotation) * speed,
          life: BULLET_LIFESPAN * lifeBonus
        })
      }
    }
  }
}