import { useEffect, RefObject } from 'react'
import { GameState } from './useGameState'
import { checkCollision, randomBetween } from '@/lib/game/utils'
import { analytics } from '@/lib/analytics'
import { ParticleSystem } from '@/lib/game/particles'
import { ScreenShake } from '@/lib/game/screenShake'
import { soundManager } from '@/lib/game/sounds'
import { Starfield } from '@/lib/game/starfield'
import { ENEMY_TYPES } from '@/lib/game/enemies'
import { BOSS_TYPES, getBossPhase, createBoss } from '@/lib/game/bosses'
import { DIFFICULTY_SETTINGS } from '@/lib/game/difficulty'
import { renderGame } from './useGameRenderer'

const PLAYER_SIZE = 20
const PLAYER_SPEED = 3

interface Level {
  number: number
  name: string
  targetScore: number
  asteroidSpeed: number
  spawnRate: number
  asteroidCount: number
}

export function useGameLoop(
  gameStateRef: RefObject<GameState>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  keysRef: RefObject<Record<string, boolean>>,
  mousePosRef: RefObject<{ x: number; y: number }>,
  particleSystemRef: RefObject<ParticleSystem>,
  screenShakeRef: RefObject<ScreenShake>,
  starfieldRef: RefObject<Starfield>,
  gameStarted: boolean,
  highScore: number,
  levelComplete: boolean,
  level: Level,
  setScore: (score: number) => void,
  setGameOver: (gameOver: boolean) => void,
  setLevelComplete: (complete: boolean) => void,
  setUnlockedLevels: (levels: number) => void,
  setHighScore: (score: number) => void
) {
  useEffect(() => {
    if (!gameStarted) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    let animationFrameId: number

    const gameLoop = () => {
      const state = gameStateRef.current
      if (!state) return

      if (state.gameOver || state.isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop)
        return
      }

      // Update power-up timers
      if (state.activePowerUps.speed > 0) state.activePowerUps.speed -= 16
      if (state.activePowerUps.multishot > 0) state.activePowerUps.multishot -= 16
      if (state.activePowerUps.bigship > 0) state.activePowerUps.bigship -= 16
      if (state.activePowerUps.shield > 0) state.activePowerUps.shield -= 16
      if (state.activePowerUps.rapidfire > 0) state.activePowerUps.rapidfire -= 16

      particleSystemRef.current?.update()
      starfieldRef.current?.update()

      let moveX = 0, moveY = 0
      if (keysRef.current?.['w']) moveY -= 1
      if (keysRef.current?.['s']) moveY += 1
      if (keysRef.current?.['a']) moveX -= 1
      if (keysRef.current?.['d']) moveX += 1

      // Update enemies
      state.enemies.forEach(enemy => {
        const playerCenterX = state.player.x + PLAYER_SIZE / 2
        const playerCenterY = state.player.y + PLAYER_SIZE / 2
        const enemyCenterX = enemy.x + enemy.width / 2
        const enemyCenterY = enemy.y + enemy.height / 2

        const angleToPlayer = Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX)
        enemy.rotation = angleToPlayer

        const config = ENEMY_TYPES[enemy.type]
        const distance = Math.sqrt(Math.pow(playerCenterX - enemyCenterX, 2) + Math.pow(playerCenterY - enemyCenterY, 2))

        if (distance > 200) {
          enemy.vx = Math.cos(angleToPlayer) * config.speed
          enemy.vy = Math.sin(angleToPlayer) * config.speed
        } else {
          const perpAngle = angleToPlayer + Math.PI / 2
          enemy.vx = Math.cos(perpAngle) * config.speed * 0.5 + Math.cos(angleToPlayer) * config.speed * 0.3
          enemy.vy = Math.sin(perpAngle) * config.speed * 0.5 + Math.sin(angleToPlayer) * config.speed * 0.3
        }

        enemy.x += enemy.vx
        enemy.y += enemy.vy

        // Enemy shooting
        const now = Date.now()
        const diffSettings = DIFFICULTY_SETTINGS[state.difficulty]
        const adjustedFireRate = config.fireRate * diffSettings.enemyFireRateMultiplier

        if (now - enemy.lastShot > adjustedFireRate && distance < 400) {
          enemy.lastShot = now

          state.enemyBullets.push({
            x: enemyCenterX,
            y: enemyCenterY,
            width: 6,
            height: 6,
            vx: Math.cos(angleToPlayer) * config.bulletSpeed,
            vy: Math.sin(angleToPlayer) * config.bulletSpeed,
            life: 200
          })

          soundManager.shoot()
        }
      })

      // Boss logic
      if (state.bossActive && state.boss) {
        const boss = state.boss
        const config = BOSS_TYPES[boss.type]

        boss.phase = getBossPhase(boss)

        boss.x += boss.vx
        if (boss.x <= 0 || boss.x >= 800 - boss.width) {
          boss.vx *= -1
        }

        if (boss.phase > 1 && Math.random() < 0.02) {
          boss.y += boss.phase * 0.5
          if (boss.y > 150) boss.y = 150
        }

        boss.rotation += 0.02

        const now = Date.now()
        const diffSettings = DIFFICULTY_SETTINGS[state.difficulty]
        const adjustedFireRate = (config.fireRate * diffSettings.bossFireRateMultiplier) / boss.phase

        if (now - boss.lastShot > adjustedFireRate) {
          boss.lastShot = now

          const bossCenterX = boss.x + boss.width / 2
          const bossCenterY = boss.y + boss.height / 2
          const playerCenterX = state.player.x + PLAYER_SIZE / 2
          const playerCenterY = state.player.y + PLAYER_SIZE / 2

          if (boss.phase === 1) {
            const angle = Math.atan2(playerCenterY - bossCenterY, playerCenterX - bossCenterX)
            state.bossBullets.push({
              x: bossCenterX,
              y: bossCenterY,
              width: 8,
              height: 8,
              vx: Math.cos(angle) * config.bulletSpeed,
              vy: Math.sin(angle) * config.bulletSpeed,
              life: 300,
              pattern: 'direct'
            })
          }

          if (boss.phase === 2) {
            for (let i = -1; i <= 1; i++) {
              const angle = Math.atan2(playerCenterY - bossCenterY, playerCenterX - bossCenterX) + (i * 0.3)
              state.bossBullets.push({
                x: bossCenterX,
                y: bossCenterY,
                width: 8,
                height: 8,
                vx: Math.cos(angle) * config.bulletSpeed,
                vy: Math.sin(angle) * config.bulletSpeed,
                life: 300,
                pattern: 'spread'
              })
            }
          }

          if (boss.phase >= 3) {
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 / 8) * i + boss.rotation
              state.bossBullets.push({
                x: bossCenterX,
                y: bossCenterY,
                width: 8,
                height: 8,
                vx: Math.cos(angle) * config.bulletSpeed * 0.8,
                vy: Math.sin(angle) * config.bulletSpeed * 0.8,
                life: 300,
                pattern: 'spiral'
              })
            }
          }

          soundManager.shoot()
        }
      }

      // Update boss bullets
      state.bossBullets = state.bossBullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x > -20 && b.x < 820 && b.y > -20 && b.y < 620)

      // Boss bullets hit player
      for (const bullet of state.bossBullets) {
        if (checkCollision(bullet, state.player)) {
          if (state.activePowerUps.shield > 0) {
            state.activePowerUps.shield = 0
            bullet.life = 0
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current?.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)
            soundManager.collision()
            analytics.gameOver(state.score, state.currentLevel, state.difficulty)
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )
            screenShakeRef.current?.trigger(15, 300)
            bullet.life = 0
          }
        }
      }

      state.bossBullets = state.bossBullets.filter(b => b.life > 0)

      // Player bullets hit boss
      if (state.boss) {
        for (const bullet of state.bullets) {
          if (checkCollision(state.boss, bullet)) {
            state.boss.health -= (state.activePowerUps.bigship > 0 ? 2 : 1)
            bullet.life = 0

            particleSystemRef.current?.createExplosion(
              bullet.x,
              bullet.y,
              5,
              BOSS_TYPES[state.boss.type].color
            )

            if (state.boss.health <= 0) {
              state.score += 1000
              soundManager.explosion()
              analytics.bossDefeated()
              particleSystemRef.current?.createExplosion(
                state.boss.x + state.boss.width / 2,
                state.boss.y + state.boss.height / 2,
                25,
                BOSS_TYPES[state.boss.type].color
              )
              screenShakeRef.current?.trigger(20, 500)

              state.powerUps.push({
                x: state.boss.x + state.boss.width / 2 - 12.5,
                y: state.boss.y + state.boss.height / 2 - 12.5,
                width: 25,
                height: 25,
                type: 'shield',
                duration: 8000
              })

              state.boss = null
              state.bossBullets = []
              state.bossActive = false
              state.bossDefeated = true
            }

            break
          }
        }
      }

      // Update enemy bullets
      state.enemyBullets = state.enemyBullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x > -10 && b.x < 810 && b.y > -10 && b.y < 610)

      // Enemy bullets hit player
      for (const bullet of state.enemyBullets) {
        if (checkCollision(bullet, state.player)) {
          if (state.activePowerUps.shield > 0) {
            state.activePowerUps.shield = 0
            bullet.life = 0
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current?.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)
            soundManager.collision()
            analytics.gameOver(state.score, state.currentLevel, state.difficulty)
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )
            screenShakeRef.current?.trigger(15, 300)
            bullet.life = 0
          }
        }
      }

      state.enemyBullets = state.enemyBullets.filter(b => b.life > 0)

      // Player bullets hit enemies
      const survivingEnemies = []
      for (const enemy of state.enemies) {
        let destroyed = false

        for (const bullet of state.bullets) {
          if (checkCollision(enemy, bullet)) {
            enemy.health -= (state.activePowerUps.bigship > 0 ? 2 : 1)
            bullet.life = 0

            particleSystemRef.current?.createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              5,
              ENEMY_TYPES[enemy.type].color
            )

            if (enemy.health <= 0) {
              destroyed = true
              state.score += ENEMY_TYPES[enemy.type].points
              soundManager.explosion()
              particleSystemRef.current?.createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                15,
                ENEMY_TYPES[enemy.type].color
              )
              screenShakeRef.current?.trigger(5, 150)

              if (Math.random() < 0.3) {
                const types: Array<'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb'> =
                  ['speed', 'multishot', 'bigship', 'shield', 'rapidfire', 'bomb']
                const type = types[Math.floor(Math.random() * types.length)]

                state.powerUps.push({
                  x: enemy.x + enemy.width / 2 - 12.5,
                  y: enemy.y + enemy.height / 2 - 12.5,
                  width: 25,
                  height: 25,
                  type,
                  duration: type === 'bomb' ? 1 : 8000
                })
              }
            }

            break
          }
        }

        if (!destroyed && checkCollision(enemy, state.player)) {
          if (state.activePowerUps.shield > 0) {
            state.activePowerUps.shield = 0
            destroyed = true
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current?.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)
            soundManager.collision()
            analytics.gameOver(state.score, state.currentLevel, state.difficulty)
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )
            screenShakeRef.current?.trigger(15, 300)
          }
        }

        if (!destroyed) {
          survivingEnemies.push(enemy)
        }
      }

      state.enemies = survivingEnemies

      // Player movement
      const playerSpeed = state.activePowerUps.bigship > 0 ? PLAYER_SPEED * 0.8 : PLAYER_SPEED
      const mag = Math.sqrt(moveX * moveX + moveY * moveY)
      if (mag > 0) {
        state.player.x += (moveX / mag) * playerSpeed
        state.player.y += (moveY / mag) * playerSpeed
      }

      state.player.x = Math.max(0, Math.min(780, state.player.x))
      state.player.y = Math.max(0, Math.min(580, state.player.y))

      const angle = Math.atan2(
        mousePosRef.current!.y - (state.player.y + PLAYER_SIZE / 2),
        mousePosRef.current!.x - (state.player.x + PLAYER_SIZE / 2)
      )
      state.player.rotation = angle

      // Update bullets
      state.bullets = state.bullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x > -10 && b.x < 810 && b.y > -10 && b.y < 610)

      // Update asteroids
      state.asteroids = state.asteroids
        .map(a => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
        .filter(a => a.x > -a.size * 2 && a.x < 800 + a.size * 2 &&
          a.y > -a.size * 2 && a.y < 600 + a.size * 2)

      // Update power-ups
      state.powerUps = state.powerUps
        .map(p => ({ ...p, y: p.y + 2 }))
        .filter(p => p.y < 650)

      // Power-up collection
      for (const powerUp of state.powerUps) {
        const px = state.player.x
        const py = state.player.y
        const pw = state.player.width
        const ph = state.player.height

        if (px < powerUp.x + powerUp.width &&
          px + pw > powerUp.x &&
          py < powerUp.y + powerUp.height &&
          py + ph > powerUp.y) {
          if (powerUp.type === 'bomb') {
            state.activePowerUps.bomb = 1
          } else {
            state.activePowerUps[powerUp.type] = powerUp.duration
          }
          powerUp.y = 999

          soundManager.powerUp()

          const colors = {
            speed: 'yellow',
            multishot: 'orange',
            bigship: 'gold',
            shield: 'blue',
            rapidfire: 'red',
            bomb: 'purple'
          }

          particleSystemRef.current?.createExplosion(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            6,
            colors[powerUp.type]
          )

          analytics.collectPowerUp(powerUp.type)
        }
      }
      state.powerUps = state.powerUps.filter(p => p.y < 650)

      // Asteroid collisions
      const survivingAsteroids = []
      const bulletDamage = state.activePowerUps.bigship > 0 ? 2 : 1

      for (const asteroid of state.asteroids) {
        let destroyed = false

        for (const bullet of state.bullets) {
          if (checkCollision(asteroid, bullet)) {
            destroyed = true
            bullet.life = 0
            state.score += Math.floor(asteroid.size * bulletDamage)
            soundManager.explosion()
            particleSystemRef.current?.createExplosion(
              asteroid.x + asteroid.size / 2,
              asteroid.y + asteroid.size / 2,
              8,
              'white'
            )
            screenShakeRef.current?.trigger(3, 100)
            break
          }
        }

        if (checkCollision(asteroid, state.player)) {
          if (state.activePowerUps.shield > 0) {
            state.activePowerUps.shield = 0
            destroyed = true
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current?.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)
            soundManager.collision()
            analytics.gameOver(state.score, state.currentLevel, state.difficulty)
            particleSystemRef.current?.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )
            screenShakeRef.current?.trigger(15, 300)
          }
        }

        if (!destroyed) {
          survivingAsteroids.push(asteroid)
        }
      }

      state.asteroids = survivingAsteroids
      state.bullets = state.bullets.filter(b => b.life > 0)
      setScore(state.score)

      // Maintain minimum asteroids
      if (!state.bossActive && state.asteroids.length < 3) {
        const diffSettings = DIFFICULTY_SETTINGS[state.difficulty]
        const size = randomBetween(diffSettings.asteroidSizeMin, diffSettings.asteroidSizeMax)
        const edge = Math.floor(randomBetween(0, 4))
        let x, y

        if (edge === 0) { x = -size; y = Math.random() * 600 }
        else if (edge === 1) { x = 800 + size; y = Math.random() * 600 }
        else if (edge === 2) { y = -size; x = Math.random() * 800 }
        else { y = 600 + size; x = Math.random() * 800 }

        const adjustedSpeed = level.asteroidSpeed * diffSettings.asteroidSpeedMultiplier

        state.asteroids.push({
          x, y, width: size, height: size, size,
          vx: randomBetween(-adjustedSpeed, adjustedSpeed),
          vy: randomBetween(-adjustedSpeed, adjustedSpeed)
        })
      }

      // Boss spawning - ONLY spawn if we haven't already defeated a boss this level
      if (state.score >= level.targetScore && !state.bossActive && !state.boss && !state.bossDefeated) {
        const bossTypes: Array<'asteroid_king' | 'void_hunter' | 'meteor_lord' | 'chaos_titan' | 'gauntlet_overlord'> = [
          'asteroid_king',
          'void_hunter',
          'meteor_lord',
          'chaos_titan',
          'gauntlet_overlord'
        ]

        state.boss = createBoss(bossTypes[state.currentLevel - 1])

        const diffSettings = DIFFICULTY_SETTINGS[state.difficulty]
        state.boss.health = Math.floor(state.boss.health * diffSettings.bossHealthMultiplier)
        state.boss.maxHealth = state.boss.health

        state.bossActive = true
        analytics.bossFight()
        state.asteroids = []
        state.enemies = []
        state.enemyBullets = []
      }

      // Level completion - ONLY after boss is defeated
      if (state.score >= level.targetScore && !state.bossActive && !state.boss && state.bossDefeated && !levelComplete) {
        if (state.currentLevel < 5) {
          setLevelComplete(true)
          if (state.currentLevel >= state.unlockedLevels) {
            state.unlockedLevels = state.currentLevel + 1
            setUnlockedLevels(state.unlockedLevels)
          }
          analytics.updateLevel(state.currentLevel + 1)
        } else {
          state.gameOver = true
          setGameOver(true)
          analytics.gameOver(state.score, state.currentLevel, state.difficulty)
        }
      }

      // Update high score
      if (state.score > highScore) {
        setHighScore(state.score)
        if (typeof window !== 'undefined') {
          localStorage.setItem('starScavengerHighScore', state.score.toString())
        }
      }

      // Render everything
      renderGame(
        ctx,
        state,
        level,
        highScore,
        particleSystemRef.current!,
        starfieldRef.current!,
        screenShakeRef.current!
      )

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [
    gameStarted,
    gameStateRef,
    canvasRef,
    keysRef,
    mousePosRef,
    particleSystemRef,
    screenShakeRef,
    starfieldRef,
    highScore,
    levelComplete,
    level,
    setScore,
    setGameOver,
    setLevelComplete,
    setUnlockedLevels,
    setHighScore
  ])
}