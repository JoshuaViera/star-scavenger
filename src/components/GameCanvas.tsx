'use client'

import React, { useRef, useState } from 'react'
import { useEffect } from 'react'
import { musicManager } from '@/lib/game/music'
import { soundManager } from '@/lib/game/sounds'
import { analytics } from '@/lib/analytics'
import { gameState } from '@/lib/game-state'
import { GameMenu } from './game/GameMenu'
import { MobileGameLayout } from './game/MobileGameLayout'
import { DesktopGameLayout } from './game/DesktopGameLayout'
import { useGameState } from '@/hooks/game/useGameState'
import { useGameSystems } from '@/hooks/game/useGameSystems'
import { useInputHandlers } from '@/hooks/game/useInputHandlers'
import { useAsteroidSpawning } from '@/hooks/game/useAsteroidSpawning'
import { usePowerUpSpawning } from '@/hooks/game/usePowerUpSpawning'
import { useEnemySpawning } from '@/hooks/game/useEnemySpawning'
import { useGameLoop } from '@/hooks/game/useGameLoop'
import { useMobileDetection } from '@/hooks/useMobileDetection'

const LEVELS = [
  { number: 1, name: 'Asteroid Belt', targetScore: 500, asteroidSpeed: 1, spawnRate: 2000, asteroidCount: 10 },
  { number: 2, name: 'Debris Field', targetScore: 1200, asteroidSpeed: 1.5, spawnRate: 1700, asteroidCount: 12 },
  { number: 3, name: 'Meteor Storm', targetScore: 2500, asteroidSpeed: 2, spawnRate: 1400, asteroidCount: 15 },
  { number: 4, name: 'Chaos Zone', targetScore: 4500, asteroidSpeed: 2.5, spawnRate: 1100, asteroidCount: 18 },
  { number: 5, name: 'The Gauntlet', targetScore: 8000, asteroidSpeed: 3, spawnRate: 900, asteroidCount: 20 }
]

const PLAYER_SPEED = 3

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const mousePosRef = useRef({ x: 400, y: 300 })
  const mobileInputRef = useRef({ x: 0, y: 0 })

  const isMobile = useMobileDetection()

  const {
    gameStateRef,
    score,
    setScore,
    gameOver,
    setGameOver,
    isPaused,
    setIsPaused,
    gameStarted,
    setGameStarted,
    currentLevel,
    setCurrentLevel,
    unlockedLevels,
    setUnlockedLevels,
    showLevelSelect,
    setShowLevelSelect,
    levelComplete,
    setLevelComplete,
    highScore,
    setHighScore,
    isMuted,
    setIsMuted,
    isMusicMuted,
    setIsMusicMuted,
    difficulty,
    setDifficulty,
    resetGame,
    selectLevel
  } = useGameState()

  const { screenShake, particles, starfield, lastShotTime } = useGameSystems()
  const level = LEVELS[gameStateRef.current.currentLevel - 1]

  // Mobile joystick movement handler
  const handleMobileMove = (x: number, y: number) => {
    if (!gameStateRef.current || !isMobile) return
    
    mobileInputRef.current.x = x
    mobileInputRef.current.y = y

    const player = gameStateRef.current.player
    player.x += x * PLAYER_SPEED
    player.y += y * PLAYER_SPEED

    player.x = Math.max(0, Math.min(780, player.x))
    player.y = Math.max(0, Math.min(580, player.y))
  }

  const handleMobileShoot = (x: number, y: number) => {
    if (!gameStateRef.current || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = ((x - rect.left) / rect.width) * 800
    const canvasY = ((y - rect.top) / rect.height) * 600

    mousePosRef.current.x = canvasX
    mousePosRef.current.y = canvasY

    const player = gameStateRef.current.player
    const angle = Math.atan2(
      canvasY - (player.y + 10),
      canvasX - (player.x + 10)
    )
    player.rotation = angle

    shoot()
  }

  const handleMobileBomb = () => {
    if (!gameStateRef.current) return
    if (gameStateRef.current.activePowerUps.bomb <= 0) return

    // Trigger bomb - copied from useInputHandlers
    gameStateRef.current.asteroids.forEach(a => {
      particles.current?.createExplosion(
        a.x + a.size / 2,
        a.y + a.size / 2,
        12,
        'orange'
      )
      gameStateRef.current!.score += Math.floor(a.size)
    })
    gameStateRef.current.asteroids = []

    gameStateRef.current.enemies.forEach(enemy => {
      particles.current?.createExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        12,
        'red'
      )
    })
    gameStateRef.current.enemies = []
    gameStateRef.current.enemyBullets = []

    if (gameStateRef.current.boss) {
      gameStateRef.current.boss.health -= 20
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
    screenShake.current?.trigger(20, 400)
  }

  const { shoot } = useInputHandlers({
    gameStateRef,
    keysRef,
    mousePosRef,
    lastShotTimeRef: lastShotTime,
    particleSystemRef: particles,
    screenShakeRef: screenShake,
    canvasRef,
    gameStarted,
    gameOver,
    setIsPaused,
    isMobile,
    mobileInputRef
  })

  useAsteroidSpawning(gameStateRef, gameStarted, level)
  usePowerUpSpawning(gameStateRef, gameStarted)
  useEnemySpawning(gameStateRef, gameStarted)

  useGameLoop(
    gameStateRef,
    canvasRef,
    keysRef,
    mousePosRef,
    particles,
    screenShake,
    starfield,
    gameStarted,
    highScore,
    levelComplete,
    level,
    setScore,
    setGameOver,
    setLevelComplete,
    setUnlockedLevels,
    setHighScore
  )

  useEffect(() => {
    if (gameStarted && !gameOver) {
      analytics.startSession(gameStateRef.current.currentLevel)
    }
  }, [gameStarted, gameOver, currentLevel, difficulty])

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      musicManager.start()
    } else {
      musicManager.stop()
    }
    return () => musicManager.stop()
  }, [gameStarted, gameOver, isPaused])

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return
    const saveInterval = setInterval(async () => {
      await gameState.saveGame({
        level: currentLevel,
        score: score,
        health: gameStateRef.current.player.health,
        game_state: {
          player: gameStateRef.current.player,
          bullets: gameStateRef.current.bullets,
          asteroids: gameStateRef.current.asteroids,
          enemies: gameStateRef.current.enemies,
          powerUps: gameStateRef.current.powerUps,
          boss: gameStateRef.current.boss,
          activePowerUps: gameStateRef.current.activePowerUps
        }
      })
    }, 30000)
    return () => clearInterval(saveInterval)
  }, [gameStarted, gameOver, isPaused, currentLevel, score, gameStateRef])

  useEffect(() => {
    if (levelComplete) {
      const nextLevel = currentLevel + 1
      if (nextLevel <= 5) {
        gameState.unlockLevel(nextLevel)
      }
      gameState.updateHighScore(score)
    }
  }, [levelComplete, currentLevel, score])

  useEffect(() => {
    if (gameOver) {
      analytics.gameOver(score, currentLevel, difficulty)
      gameState.updateHighScore(score)
      gameState.deleteSavedGame()
    }
  }, [gameOver, score, currentLevel, difficulty])

  if (!gameStarted) {
    return (
      <GameMenu
        highScore={highScore}
        onStartGame={(level: number, selectedDifficulty: string) => {
          gameStateRef.current.currentLevel = level
          gameStateRef.current.difficulty = selectedDifficulty as 'easy' | 'medium' | 'hard'
          setCurrentLevel(level)
          setDifficulty(selectedDifficulty as 'easy' | 'medium' | 'hard')
          setGameStarted(true)
          setGameOver(false)
          setLevelComplete(false)
          resetGame()
        }}
        onResumeGame={(savedState) => {
          setCurrentLevel(savedState.level)
          setScore(savedState.score)
          gameStateRef.current.player = savedState.game_state.player as typeof gameStateRef.current.player
          gameStateRef.current.bullets = (savedState.game_state.bullets || []) as typeof gameStateRef.current.bullets
          gameStateRef.current.asteroids = (savedState.game_state.asteroids || []) as typeof gameStateRef.current.asteroids
          gameStateRef.current.enemies = (savedState.game_state.enemies || []) as typeof gameStateRef.current.enemies
          gameStateRef.current.powerUps = (savedState.game_state.powerUps || []) as typeof gameStateRef.current.powerUps
          gameStateRef.current.boss = (savedState.game_state.boss || null) as typeof gameStateRef.current.boss
          gameStateRef.current.activePowerUps = savedState.game_state.activePowerUps || {
            speed: 0, multishot: 0, bigship: 0, shield: 0, rapidfire: 0, bomb: 0
          }
          setGameStarted(true)
          setGameOver(false)
          setLevelComplete(false)
        }}
      />
    )
  }

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <>
        <MobileGameLayout
          canvasRef={canvasRef}
          score={score}
          isPaused={isPaused}
          hasBomb={gameStateRef.current?.activePowerUps?.bomb > 0}
          onPause={() => {
            gameStateRef.current.isPaused = !gameStateRef.current.isPaused
            setIsPaused(gameStateRef.current.isPaused)
          }}
          onBomb={handleMobileBomb}
          onMove={handleMobileMove}
          onShoot={handleMobileShoot}
        />

        {/* Mobile Overlays */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50">
            <h2 className="text-5xl font-bold mb-8">Paused</h2>
            <button
              onClick={() => {
                gameStateRef.current.isPaused = false
                setIsPaused(false)
              }}
              className="px-12 py-4 bg-green-500 rounded-lg text-xl font-bold mb-4"
            >
              Resume
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setIsPaused(false)
              }}
              className="px-12 py-4 bg-gray-700 rounded-lg text-xl font-bold"
            >
              Main Menu
            </button>
          </div>
        )}

        {levelComplete && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50 px-4">
            <h2 className="text-5xl font-bold text-cyan-400 mb-4">Level Complete!</h2>
            <p className="text-3xl mb-8">Score: {score}</p>
            <button
              onClick={() => {
                gameStateRef.current.currentLevel += 1
                setCurrentLevel(gameStateRef.current.currentLevel)
                analytics.retry()
                resetGame()
              }}
              className="w-full max-w-md px-8 py-6 bg-cyan-500 rounded-lg text-2xl font-bold mb-4"
            >
              Next Level
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setLevelComplete(false)
              }}
              className="w-full max-w-md px-8 py-6 bg-gray-700 rounded-lg text-2xl font-bold"
            >
              Main Menu
            </button>
          </div>
        )}

        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50 px-4">
            <h2 className="text-5xl font-bold mb-4">
              {currentLevel === 5 && score >= LEVELS[4].targetScore ? 'You Win!' : 'Game Over'}
            </h2>
            <p className="text-3xl mb-2">Final Score: {score}</p>
            {score > highScore && <p className="text-2xl text-yellow-400 mb-8">New High Score!</p>}
            <button
              onClick={() => {
                analytics.retry()
                resetGame()
              }}
              className="w-full max-w-md px-8 py-6 bg-cyan-500 rounded-lg text-2xl font-bold mb-4"
            >
              Replay Level
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setGameOver(false)
              }}
              className="w-full max-w-md px-8 py-6 bg-gray-700 rounded-lg text-2xl font-bold"
            >
              Main Menu
            </button>
          </div>
        )}
      </>
    )
  }

  // DESKTOP LAYOUT  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <DesktopGameLayout
        canvasRef={canvasRef}
        isPaused={isPaused}
        isMuted={isMuted}
        isMusicMuted={isMusicMuted}
        onPause={() => {
          gameStateRef.current.isPaused = !gameStateRef.current.isPaused
          setIsPaused(gameStateRef.current.isPaused)
        }}
        onMuteSound={() => setIsMuted(soundManager.toggleMute())}
        onMuteMusic={() => setIsMusicMuted(musicManager.toggleMute())}
        onShowLevelSelect={() => setShowLevelSelect(true)}
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
          <h2 className="text-5xl font-bold">
            {currentLevel === 5 && score >= LEVELS[4].targetScore ? 'You Win!' : 'Game Over'}
          </h2>
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
            {LEVELS.map(lvl => (
              <button
                key={lvl.number}
                onClick={() => selectLevel(lvl.number)}
                disabled={lvl.number > unlockedLevels}
                className={`px-6 py-3 rounded ${lvl.number <= unlockedLevels
                  ? 'bg-cyan-500 hover:bg-cyan-600'
                  : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Level {lvl.number}: {lvl.name} {lvl.number > unlockedLevels && '🔒'}
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