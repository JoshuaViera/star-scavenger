// src/components/GameCanvas.tsx
'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Bullet, Asteroid } from '@/lib/game/types'
import { checkCollision, randomBetween } from '@/lib/game/utils'
import { analytics } from '@/lib/analytics'
import { ScreenShake } from '@/lib/game/screenShake'
import { ParticleSystem } from '@/lib/game/particles'
import { soundManager } from '@/lib/game/sounds'
import { Starfield } from '@/lib/game/starfield'
import { musicManager } from '@/lib/game/music'
import { Enemy, EnemyBullet } from '@/lib/game/types'
import { createEnemy, ENEMY_TYPES } from '@/lib/game/enemies'

const PLAYER_SIZE = 20
const PLAYER_SPEED = 3
const BULLET_SPEED = 5
const BULLET_LIFESPAN = 100

interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  type: 'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb'
  duration: number
}

interface Level {
  number: number
  name: string
  targetScore: number
  asteroidSpeed: number
  spawnRate: number
  asteroidCount: number
}

const LEVELS: Level[] = [
  { number: 1, name: 'Asteroid Belt', targetScore: 500, asteroidSpeed: 1, spawnRate: 2000, asteroidCount: 10 },
  { number: 2, name: 'Debris Field', targetScore: 1200, asteroidSpeed: 1.5, spawnRate: 1700, asteroidCount: 12 },
  { number: 3, name: 'Meteor Storm', targetScore: 2500, asteroidSpeed: 2, spawnRate: 1400, asteroidCount: 15 },
  { number: 4, name: 'Chaos Zone', targetScore: 4500, asteroidSpeed: 2.5, spawnRate: 1100, asteroidCount: 18 },
  { number: 5, name: 'The Gauntlet', targetScore: 8000, asteroidSpeed: 3, spawnRate: 900, asteroidCount: 20 }
]

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const mousePosRef = useRef({ x: 400, y: 300 })
  const screenShakeRef = useRef(new ScreenShake())
  const particleSystemRef = useRef(new ParticleSystem())
  const starfieldRef = useRef(new Starfield(100))
  const lastShotTimeRef = useRef(0)
  const gameStateRef = useRef({
    player: { x: 390, y: 290, width: PLAYER_SIZE, height: PLAYER_SIZE, vx: 0, vy: 0, rotation: 0, health: 100 },
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    powerUps: [] as PowerUp[],
    enemies: [] as Enemy[],
    enemyBullets: [] as EnemyBullet[],
    score: 0,
    gameOver: false,
    isPaused: false,
    activePowerUps: { speed: 0, multishot: 0, bigship: 0, shield: 0, rapidfire: 0, bomb: 0 },
    currentLevel: 1,
    unlockedLevels: 1
  })

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [unlockedLevels, setUnlockedLevels] = useState(1)
  const [showLevelSelect, setShowLevelSelect] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isMusicMuted, setIsMusicMuted] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHighScore(parseInt(localStorage.getItem('starScavengerHighScore') || '0'))
    }
  }, [])

  const resetGame = () => {
    gameStateRef.current = {
      player: { x: 390, y: 290, width: PLAYER_SIZE, height: PLAYER_SIZE, vx: 0, vy: 0, rotation: 0, health: 100 },
      bullets: [],
      asteroids: [],
      powerUps: [],
      enemies: [],
      enemyBullets: [],
      score: 0,
      gameOver: false,
      isPaused: false,
      activePowerUps: { speed: 0, multishot: 0, bigship: 0, shield: 0, rapidfire: 0, bomb: 0 },
      currentLevel: gameStateRef.current.currentLevel,
      unlockedLevels: gameStateRef.current.unlockedLevels
    }
    setScore(0)
    setGameOver(false)
    setLevelComplete(false)
    setGameStarted(true)
    setIsPaused(false)

    analytics.startSession(gameStateRef.current.currentLevel)
  }

  const selectLevel = (level: number) => {
    gameStateRef.current.currentLevel = level
    setCurrentLevel(level)
    setShowLevelSelect(false)
    resetGame()
  }

  useEffect(() => {
    if (gameStarted && !gameOver) {
      analytics.startSession(currentLevel)
    }
  }, [gameStarted, gameOver, currentLevel])

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      musicManager.start()
    } else {
      musicManager.stop()
    }

    return () => musicManager.stop()
  }, [gameStarted, gameOver, isPaused])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') {
        if (gameStarted && !gameOver) {
          gameStateRef.current.isPaused = !gameStateRef.current.isPaused
          setIsPaused(gameStateRef.current.isPaused)
        }
        return
      }

      if (e.key === ' ' && gameStateRef.current.activePowerUps.bomb > 0) {
        e.preventDefault()

        // Destroy all asteroids
        gameStateRef.current.asteroids.forEach(a => {
          particleSystemRef.current.createExplosion(
            a.x + a.size / 2,
            a.y + a.size / 2,
            12,
            'orange'
          )
          gameStateRef.current.score += Math.floor(a.size)
        })
        gameStateRef.current.asteroids = []

        // Destroy all enemies
        gameStateRef.current.enemies.forEach(enemy => {
          particleSystemRef.current.createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            12,
            ENEMY_TYPES[enemy.type].color
          )
          gameStateRef.current.score += ENEMY_TYPES[enemy.type].points
        })
        gameStateRef.current.enemies = []
        gameStateRef.current.enemyBullets = []

        gameStateRef.current.activePowerUps.bomb = 0
        soundManager.explosion()
        screenShakeRef.current.trigger(20, 400)
        return
      }

      keysRef.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        mousePosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }
    }
    const handleShoot = () => {
      if (gameStateRef.current.gameOver || !gameStarted || gameStateRef.current.isPaused) return

      const now = Date.now()
      const fireRate = gameStateRef.current.activePowerUps.rapidfire > 0 ? 100 : 200
      if (now - lastShotTimeRef.current < fireRate) return
      lastShotTimeRef.current = now

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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleShoot)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleShoot)
    }
  }, [gameStarted, gameOver])

  useEffect(() => {
    if (!gameStarted) return
    const level = LEVELS[gameStateRef.current.currentLevel - 1]

    const spawnInterval = setInterval(() => {
      if (gameStateRef.current.gameOver || gameStateRef.current.isPaused ||
        gameStateRef.current.asteroids.length >= level.asteroidCount) return

      const size = randomBetween(20, 50)
      const edge = Math.floor(randomBetween(0, 4))
      let x, y

      if (edge === 0) { x = -size; y = Math.random() * 600 }
      else if (edge === 1) { x = 800 + size; y = Math.random() * 600 }
      else if (edge === 2) { y = -size; x = Math.random() * 800 }
      else { y = 600 + size; x = Math.random() * 800 }

      gameStateRef.current.asteroids.push({
        x, y, width: size, height: size, size,
        vx: randomBetween(-level.asteroidSpeed, level.asteroidSpeed),
        vy: randomBetween(-level.asteroidSpeed, level.asteroidSpeed)
      })
    }, level.spawnRate)

    return () => clearInterval(spawnInterval)
  }, [gameStarted])

  useEffect(() => {
    if (!gameStarted) return

    const powerUpInterval = setInterval(() => {
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
  }, [gameStarted])
  useEffect(() => {
    if (!gameStarted) return

    const enemySpawnInterval = setInterval(() => {
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
      gameStateRef.current.enemies.push(enemy)
    }, 8000) // Spawn enemy every 8 seconds

    return () => clearInterval(enemySpawnInterval)
  }, [gameStarted])

  useEffect(() => {
    if (!gameStarted) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    let animationFrameId: number

    const gameLoop = () => {
      const state = gameStateRef.current
      const level = LEVELS[state.currentLevel - 1]

      if (state.gameOver || state.isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop)
        return
      }

      if (state.activePowerUps.speed > 0) state.activePowerUps.speed -= 16
      if (state.activePowerUps.multishot > 0) state.activePowerUps.multishot -= 16
      if (state.activePowerUps.bigship > 0) state.activePowerUps.bigship -= 16
      if (state.activePowerUps.shield > 0) state.activePowerUps.shield -= 16
      if (state.activePowerUps.rapidfire > 0) state.activePowerUps.rapidfire -= 16

      particleSystemRef.current.update()
      starfieldRef.current.update()

      let moveX = 0, moveY = 0
      if (keysRef.current['w']) moveY -= 1
      if (keysRef.current['s']) moveY += 1
      if (keysRef.current['a']) moveX -= 1
      if (keysRef.current['d']) moveX += 1

      // Update enemies
      state.enemies.forEach(enemy => {
        const playerCenterX = state.player.x + PLAYER_SIZE / 2
        const playerCenterY = state.player.y + PLAYER_SIZE / 2
        const enemyCenterX = enemy.x + enemy.width / 2
        const enemyCenterY = enemy.y + enemy.height / 2

        // Calculate angle to player
        const angleToPlayer = Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX)
        enemy.rotation = angleToPlayer

        // Move toward player with some evasive maneuvers
        const config = ENEMY_TYPES[enemy.type]
        const distance = Math.sqrt(Math.pow(playerCenterX - enemyCenterX, 2) + Math.pow(playerCenterY - enemyCenterY, 2))

        if (distance > 200) {
          // Move toward player
          enemy.vx = Math.cos(angleToPlayer) * config.speed
          enemy.vy = Math.sin(angleToPlayer) * config.speed
        } else {
          // Circle around player at distance
          const perpAngle = angleToPlayer + Math.PI / 2
          enemy.vx = Math.cos(perpAngle) * config.speed * 0.5 + Math.cos(angleToPlayer) * config.speed * 0.3
          enemy.vy = Math.sin(perpAngle) * config.speed * 0.5 + Math.sin(angleToPlayer) * config.speed * 0.3
        }

        enemy.x += enemy.vx
        enemy.y += enemy.vy

        // Shoot at player
        const now = Date.now()
        if (now - enemy.lastShot > config.fireRate && distance < 400) {
          enemy.lastShot = now

          state.enemyBullets.push({
            x: enemyCenterX,
            y: enemyCenterY,
            width: 4,
            height: 4,
            vx: Math.cos(angleToPlayer) * config.bulletSpeed,
            vy: Math.sin(angleToPlayer) * config.bulletSpeed,
            life: 200
          })

          soundManager.shoot()
        }
      })

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
            particleSystemRef.current.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)

            soundManager.collision()
            analytics.gameOver(state.score)

            particleSystemRef.current.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )

            screenShakeRef.current.trigger(15, 300)
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

            particleSystemRef.current.createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              5,
              ENEMY_TYPES[enemy.type].color
            )

            if (enemy.health <= 0) {
              destroyed = true
              state.score += ENEMY_TYPES[enemy.type].points

              soundManager.explosion()

              particleSystemRef.current.createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                15,
                ENEMY_TYPES[enemy.type].color
              )

              screenShakeRef.current.trigger(5, 150)

              // 30% chance to drop power-up
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

        // Check collision with player
        if (!destroyed && checkCollision(enemy, state.player)) {
          if (state.activePowerUps.shield > 0) {
            state.activePowerUps.shield = 0
            destroyed = true
            particleSystemRef.current.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)

            soundManager.collision()
            analytics.gameOver(state.score)

            particleSystemRef.current.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )

            screenShakeRef.current.trigger(15, 300)
          }
        }

        if (!destroyed) {
          survivingEnemies.push(enemy)
        }
      }

      state.enemies = survivingEnemies

      const playerSpeed = state.activePowerUps.bigship > 0 ? PLAYER_SPEED * 0.8 : PLAYER_SPEED
      const mag = Math.sqrt(moveX * moveX + moveY * moveY)
      if (mag > 0) {
        state.player.x += (moveX / mag) * playerSpeed
        state.player.y += (moveY / mag) * playerSpeed
      }

      state.player.x = Math.max(0, Math.min(780, state.player.x))
      state.player.y = Math.max(0, Math.min(580, state.player.y))

      const angle = Math.atan2(
        mousePosRef.current.y - (state.player.y + PLAYER_SIZE / 2),
        mousePosRef.current.x - (state.player.x + PLAYER_SIZE / 2)
      )
      state.player.rotation = angle

      state.bullets = state.bullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x > -10 && b.x < 810 && b.y > -10 && b.y < 610)

      state.asteroids = state.asteroids
        .map(a => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
        .filter(a => a.x > -a.size * 2 && a.x < 800 + a.size * 2 &&
          a.y > -a.size * 2 && a.y < 600 + a.size * 2)

      state.powerUps = state.powerUps
        .map(p => ({ ...p, y: p.y + 2 }))
        .filter(p => p.y < 650)

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

          particleSystemRef.current.createExplosion(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            6,
            colors[powerUp.type]
          )

          analytics.collectPowerUp(powerUp.type)
        }
      }
      state.powerUps = state.powerUps.filter(p => p.y < 650)

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

            particleSystemRef.current.createExplosion(
              asteroid.x + asteroid.size / 2,
              asteroid.y + asteroid.size / 2,
              8,
              'white'
            )

            screenShakeRef.current.trigger(3, 100)
            break
          }
        }

        if (checkCollision(asteroid, state.player)) {
          if (state.activePowerUps.shield > 0) {
            state.activePowerUps.shield = 0
            destroyed = true
            particleSystemRef.current.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              15,
              'blue'
            )
            soundManager.powerUp()
            screenShakeRef.current.trigger(8, 200)
          } else {
            state.gameOver = true
            setGameOver(true)

            soundManager.collision()

            analytics.gameOver(state.score)

            particleSystemRef.current.createExplosion(
              state.player.x + PLAYER_SIZE / 2,
              state.player.y + PLAYER_SIZE / 2,
              20,
              'cyan'
            )

            screenShakeRef.current.trigger(15, 300)
          }
        }

        if (!destroyed) {
          survivingAsteroids.push(asteroid)
        }
      }

      state.asteroids = survivingAsteroids
      state.bullets = state.bullets.filter(b => b.life > 0)
      setScore(state.score)

      if (state.score >= level.targetScore && !levelComplete) {
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
          analytics.gameOver(state.score)
        }
      }

      if (state.score > highScore) {
        setHighScore(state.score)
        if (typeof window !== 'undefined') {
          localStorage.setItem('starScavengerHighScore', state.score.toString())
        }
      }

      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 800, 600)

      starfieldRef.current.render(ctx)

      const shakeOffset = screenShakeRef.current.getOffset()
      ctx.save()
      ctx.translate(shakeOffset.x, shakeOffset.y)

      const shipSize = state.activePowerUps.bigship > 0 ? 1.5 : 1
      ctx.save()
      ctx.translate(state.player.x + PLAYER_SIZE / 2, state.player.y + PLAYER_SIZE / 2)
      ctx.rotate(state.player.rotation)
      ctx.scale(shipSize, shipSize)
      ctx.beginPath()
      ctx.moveTo(10, 0)
      ctx.lineTo(-10, -8)
      ctx.lineTo(-10, 8)
      ctx.closePath()

      const shipColor = state.activePowerUps.bigship > 0 ? 'gold' :
        state.activePowerUps.shield > 0 ? 'blue' : 'cyan'
      ctx.fillStyle = shipColor
      ctx.shadowColor = shipColor
      ctx.shadowBlur = 10
      ctx.fill()

      if (state.activePowerUps.shield > 0) {
        ctx.beginPath()
        ctx.arc(0, 0, 20, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.restore()

      state.bullets.forEach(b => {
        const bulletColor = state.activePowerUps.speed > 0 ? 'yellow' :
          state.activePowerUps.rapidfire > 0 ? 'red' : 'magenta'
        ctx.fillStyle = bulletColor
        ctx.shadowColor = bulletColor
        ctx.shadowBlur = 15
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
      })

      state.asteroids.forEach(a => {
        ctx.strokeStyle = 'white'
        ctx.shadowColor = 'white'
        ctx.shadowBlur = 5
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(a.x + a.size * 0.5, a.y)
        ctx.lineTo(a.x + a.size, a.y + a.size * 0.3)
        ctx.lineTo(a.x + a.size * 0.8, a.y + a.size)
        ctx.lineTo(a.x + a.size * 0.2, a.y + a.size)
        ctx.lineTo(a.x, a.y + a.size * 0.7)
        ctx.closePath()
        ctx.stroke()
      })

      particleSystemRef.current.render(ctx)
      // Render enemies
      state.enemies.forEach(enemy => {
        const config = ENEMY_TYPES[enemy.type]

        ctx.save()
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
        ctx.rotate(enemy.rotation)

        // Draw enemy ship
        ctx.fillStyle = config.color
        ctx.shadowColor = config.color
        ctx.shadowBlur = 10

        ctx.beginPath()
        ctx.moveTo(enemy.width / 2, 0)
        ctx.lineTo(-enemy.width / 2, -enemy.height / 3)
        ctx.lineTo(-enemy.width / 3, 0)
        ctx.lineTo(-enemy.width / 2, enemy.height / 3)
        ctx.closePath()
        ctx.fill()

        ctx.restore()

        // Draw health bar
        if (enemy.health < ENEMY_TYPES[enemy.type].health) {
          const healthPercent = enemy.health / ENEMY_TYPES[enemy.type].health
          ctx.fillStyle = 'red'
          ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 3)
          ctx.fillStyle = 'lime'
          ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 3)
        }
      })

      // Render enemy bullets
      ctx.fillStyle = 'red'
      ctx.shadowColor = 'red'
      ctx.shadowBlur = 10
      state.enemyBullets.forEach(b => {
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
      })
      ctx.shadowBlur = 0

      const powerUpColors = {
        speed: 'yellow',
        multishot: 'orange',
        bigship: 'gold',
        shield: 'blue',
        rapidfire: 'red',
        bomb: 'purple'
      }

      const powerUpLetters = {
        speed: 'S',
        multishot: 'M',
        bigship: 'B',
        shield: 'H',
        rapidfire: 'R',
        bomb: 'X'
      }

      state.powerUps.forEach(p => {
        ctx.fillStyle = powerUpColors[p.type]
        ctx.shadowColor = ctx.fillStyle
        ctx.shadowBlur = 20
        ctx.fillRect(p.x, p.y, p.width, p.height)
        ctx.shadowBlur = 0
        ctx.fillStyle = 'black'
        ctx.font = 'bold 10px Arial'
        ctx.fillText(powerUpLetters[p.type], p.x + 8, p.y + 17)
      })

      ctx.shadowBlur = 0
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px Arial'
      ctx.fillText(`Level ${state.currentLevel}: ${level.name}`, 10, 30)
      ctx.fillText(`Score: ${state.score} / ${level.targetScore}`, 10, 55)
      ctx.fillText(`High Score: ${highScore}`, 10, 80)

      let powerUpY = 105
      if (state.activePowerUps.speed > 0) {
        ctx.fillStyle = 'yellow'
        ctx.fillText(`Speed: ${Math.ceil(state.activePowerUps.speed / 1000)}s`, 10, powerUpY)
        powerUpY += 25
      }
      if (state.activePowerUps.multishot > 0) {
        ctx.fillStyle = 'orange'
        ctx.fillText(`Multi-Shot: ${Math.ceil(state.activePowerUps.multishot / 1000)}s`, 10, powerUpY)
        powerUpY += 25
      }
      if (state.activePowerUps.bigship > 0) {
        ctx.fillStyle = 'gold'
        ctx.fillText(`Big Ship: ${Math.ceil(state.activePowerUps.bigship / 1000)}s`, 10, powerUpY)
        powerUpY += 25
      }
      if (state.activePowerUps.shield > 0) {
        ctx.fillStyle = 'blue'
        ctx.fillText(`Shield: ${Math.ceil(state.activePowerUps.shield / 1000)}s`, 10, powerUpY)
        powerUpY += 25
      }
      if (state.activePowerUps.rapidfire > 0) {
        ctx.fillStyle = 'red'
        ctx.fillText(`Rapid-Fire: ${Math.ceil(state.activePowerUps.rapidfire / 1000)}s`, 10, powerUpY)
        powerUpY += 25
      }
      if (state.activePowerUps.bomb > 0) {
        ctx.fillStyle = 'purple'
        ctx.fillText(`BOMB Ready! (SPACE)`, 10, powerUpY)
      }

      ctx.restore()

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [gameStarted, highScore, levelComplete])

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-6xl font-bold mb-8 text-cyan-400">Star Scavenger</h1>
        <p className="text-xl mb-4">High Score: {highScore}</p>
        <button
          onClick={() => setGameStarted(true)}
          className="px-8 py-4 text-2xl bg-cyan-500 rounded hover:bg-cyan-600 transition-colors mb-4"
        >
          Start Game
        </button>
        <button
          onClick={() => setShowLevelSelect(true)}
          className="px-8 py-4 text-xl bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          Select Level
        </button>

        {showLevelSelect && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Select Level</h2>
            <div className="grid grid-cols-1 gap-3">
              {LEVELS.map(level => (
                <button
                  key={level.number}
                  onClick={() => selectLevel(level.number)}
                  disabled={level.number > unlockedLevels}
                  className={`px-6 py-3 rounded ${level.number <= unlockedLevels
                    ? 'bg-cyan-500 hover:bg-cyan-600'
                    : 'bg-gray-600 cursor-not-allowed'
                    }`}
                >
                  Level {level.number}: {level.name} {level.number > unlockedLevels && '🔒'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center max-w-md">
          <h3 className="text-xl font-bold mb-2">Controls</h3>
          <p>WASD - Move</p>
          <p>Mouse - Aim</p>
          <p>Click - Shoot</p>
          <p>SPACE - Activate Bomb (when collected)</p>
          <p>P - Pause</p>
        </div>

        <div className="mt-6 text-center max-w-xl">
          <h3 className="text-xl font-bold mb-3">Power-Ups</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-yellow-400">Speed (S)</span> - Faster bullets</div>
            <div><span className="text-orange-400">Multi-Shot (M)</span> - Triple shot</div>
            <div><span className="text-yellow-300">Big Ship (B)</span> - 2x damage</div>
            <div><span className="text-blue-400">Shield (H)</span> - Absorb 1 hit</div>
            <div><span className="text-red-400">Rapid-Fire (R)</span> - Faster shooting</div>
            <div><span className="text-purple-400">Bomb (X)</span> - Destroy all asteroids</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => {
            gameStateRef.current.isPaused = !gameStateRef.current.isPaused
            setIsPaused(gameStateRef.current.isPaused)
          }}
          className="px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setIsMuted(soundManager.toggleMute())}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={() => setIsMusicMuted(musicManager.toggleMute())}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          {isMusicMuted ? '🎵' : '🎶'}
        </button>
        <button
          onClick={() => setShowLevelSelect(true)}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          Levels
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="bg-black border-2 border-cyan-700 cursor-crosshair"
      />

      {isPaused && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white">
          <h2 className="text-5xl font-bold">Paused</h2>
          <p className="text-xl mt-4">Press P or click Resume</p>
        </div>
      )}

      {levelComplete && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white">
          <h2 className="text-5xl font-bold text-cyan-400">Level Complete!</h2>
          <p className="text-2xl mt-4">Score: {score}</p>
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                gameStateRef.current.currentLevel += 1
                setCurrentLevel(gameStateRef.current.currentLevel)
                analytics.retry()
                resetGame()
              }}
              className="px-6 py-3 bg-cyan-500 rounded hover:bg-cyan-600 transition-colors"
            >
              Next Level
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setLevelComplete(false)
              }}
              className="px-6 py-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white">
          <h2 className="text-5xl font-bold">{currentLevel === 5 && score >= LEVELS[4].targetScore ? 'You Win!' : 'Game Over'}</h2>
          <p className="text-2xl mt-4">Final Score: {score}</p>
          {score > highScore && <p className="text-xl mt-2 text-yellow-400">New High Score!</p>}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                analytics.retry()
                resetGame()
              }}
              className="px-6 py-3 bg-cyan-500 rounded hover:bg-cyan-600 transition-colors"
            >
              Replay Level
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setGameOver(false)
              }}
              className="px-6 py-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {showLevelSelect && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-90 flex flex-col justify-center items-center text-white">
          <h2 className="text-3xl font-bold mb-6">Select Level</h2>
          <div className="grid grid-cols-1 gap-3">
            {LEVELS.map(level => (
              <button
                key={level.number}
                onClick={() => selectLevel(level.number)}
                disabled={level.number > unlockedLevels}
                className={`px-6 py-3 rounded ${level.number <= unlockedLevels
                  ? 'bg-cyan-500 hover:bg-cyan-600'
                  : 'bg-gray-600 cursor-not-allowed'
                  }`}
              >
                Level {level.number}: {level.name} {level.number > unlockedLevels && '🔒'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowLevelSelect(false)}
            className="mt-6 px-6 py-3 bg-gray-700 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}

export default GameCanvas