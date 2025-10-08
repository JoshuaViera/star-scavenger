'use client'

import React, { useRef, useState } from 'react'
import { useEffect } from 'react'
import { musicManager } from '@/lib/game/music'
import { soundManager } from '@/lib/game/sounds'
import { analytics } from '@/lib/analytics'
import { gameState } from '@/lib/game-state'
import { GameMenu } from './game/GameMenu'
import { MobileJoystick } from './game/MobileJoystick'
import { useGameState } from '@/hooks/game/useGameState'
import { useGameSystems } from '@/hooks/game/useGameSystems'
import { useInputHandlers } from '@/hooks/game/useInputHandlers'
import { useAsteroidSpawning } from '@/hooks/game/useAsteroidSpawning'
import { usePowerUpSpawning } from '@/hooks/game/usePowerUpSpawning'
import { useEnemySpawning } from '@/hooks/game/useEnemySpawning'
import { useGameLoop } from '@/hooks/game/useGameLoop'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import { useResponsiveCanvas } from '@/hooks/useResponsiveCanvas'

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

  // Mobile detection
  const isMobile = useMobileDetection()
  const canvasSize = useResponsiveCanvas(canvasRef)

  // Game state
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

  // Game systems
  const { screenShake, particles, starfield, lastShotTime } = useGameSystems()

  const level = LEVELS[gameStateRef.current.currentLevel - 1]

  // Input handlers with mobile support
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

  // Mobile joystick handlers
  const handleMobileMove = (x: number, y: number) => {
    if (!gameStateRef.current || !isMobile) return
    
    mobileInputRef.current.x = x
    mobileInputRef.current.y = y

    // Update player position directly for mobile
    const player = gameStateRef.current.player
    player.x += x * PLAYER_SPEED
    player.y += y * PLAYER_SPEED

    // Keep player in bounds
    player.x = Math.max(0, Math.min(780, player.x))
    player.y = Math.max(0, Math.min(580, player.y))
  }

  const handleMobileShoot = (x: number, y: number) => {
    if (!gameStateRef.current || !canvasRef.current) return

    // Convert screen coordinates to canvas coordinates
    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = ((x - rect.left) / rect.width) * 800
    const canvasY = ((y - rect.top) / rect.height) * 600

    // Update mouse position for aiming
    mousePosRef.current.x = canvasX
    mousePosRef.current.y = canvasY

    // Update player rotation to aim at tap
    const player = gameStateRef.current.player
    const angle = Math.atan2(
      canvasY - (player.y + 10),
      canvasX - (player.x + 10)
    )
    player.rotation = angle

    // Shoot
    shoot()
  }

  // Spawning systems
  useAsteroidSpawning(gameStateRef, gameStarted, level)
  usePowerUpSpawning(gameStateRef, gameStarted)
  useEnemySpawning(gameStateRef, gameStarted)

  // Main game loop
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

  // Music management & analytics
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

  // Auto-save game state every 30 seconds
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

  // Handle level complete - update Supabase
  useEffect(() => {
    if (levelComplete) {
      const nextLevel = currentLevel + 1
      if (nextLevel <= 5) {
        gameState.unlockLevel(nextLevel)
      }
      gameState.updateHighScore(score)
    }
  }, [levelComplete, currentLevel, score])

  // Handle game over - submit to leaderboard
  useEffect(() => {
    if (gameOver) {
      analytics.gameOver(score, currentLevel, difficulty)
      gameState.updateHighScore(score)
      gameState.deleteSavedGame()
    }
  }, [gameOver, score, currentLevel, difficulty])

  // Main menu
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

  // Game UI
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
      {/* Mobile Joystick */}
      {isMobile && gameStarted && !gameOver && !isPaused && (
        <MobileJoystick
          onMove={handleMobileMove}
          onShoot={handleMobileShoot}
        />
      )}

      {/* UI Buttons - Larger on mobile */}
      <div className={`absolute top-4 right-4 flex gap-2 z-10 ${isMobile ? 'scale-125' : ''}`}>
        <button
          onClick={() => {
            gameStateRef.current.isPaused = !gameStateRef.current.isPaused
            setIsPaused(gameStateRef.current.isPaused)
          }}
          className={`${isMobile ? 'px-6 py-3' : 'px-4 py-2'} bg-yellow-500 rounded hover:bg-yellow-600 transition-colors`}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setIsMuted(soundManager.toggleMute())}
          className={`${isMobile ? 'px-6 py-3' : 'px-4 py-2'} bg-gray-700 rounded hover:bg-gray-600 transition-colors`}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={() => setIsMusicMuted(musicManager.toggleMute())}
          className={`${isMobile ? 'px-6 py-3' : 'px-4 py-2'} bg-gray-700 rounded hover:bg-gray-600 transition-colors`}
        >
          {isMusicMuted ? '🎵' : '🎶'}
        </button>
        {!isMobile && (
          <button
            onClick={() => setShowLevelSelect(true)}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            Levels
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className={`bg-black border-2 border-cyan-700 ${isMobile ? '' : 'cursor-crosshair'}`}
        style={{
          touchAction: 'none',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      />

      {isPaused && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white">
          <h2 className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-bold`}>Paused</h2>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} mt-4`}>
            {isMobile ? 'Tap Resume' : 'Press P or click Resume'}
          </p>
        </div>
      )}

      {levelComplete && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white px-4">
          <h2 className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-bold text-cyan-400`}>Level Complete!</h2>
          <p className={`${isMobile ? 'text-xl' : 'text-2xl'} mt-4`}>Score: {score}</p>
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                gameStateRef.current.currentLevel += 1
                setCurrentLevel(gameStateRef.current.currentLevel)
                analytics.retry()
                resetGame()
              }}
              className={`${isMobile ? 'px-8 py-4 text-lg' : 'px-6 py-3'} bg-cyan-500 rounded hover:bg-cyan-600 transition-colors`}
            >
              Next Level
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setLevelComplete(false)
              }}
              className={`${isMobile ? 'px-8 py-4 text-lg' : 'px-6 py-3'} bg-gray-700 rounded hover:bg-gray-600 transition-colors`}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white px-4">
          <h2 className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-bold`}>
            {currentLevel === 5 && score >= LEVELS[4].targetScore ? 'You Win!' : 'Game Over'}
          </h2>
          <p className={`${isMobile ? 'text-xl' : 'text-2xl'} mt-4`}>Final Score: {score}</p>
          {score > highScore && <p className={`${isMobile ? 'text-lg' : 'text-xl'} mt-2 text-yellow-400`}>New High Score!</p>}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                analytics.retry()
                resetGame()
              }}
              className={`${isMobile ? 'px-8 py-4 text-lg' : 'px-6 py-3'} bg-cyan-500 rounded hover:bg-cyan-600 transition-colors`}
            >
              Replay Level
            </button>
            <button
              onClick={() => {
                setGameStarted(false)
                setGameOver(false)
              }}
              className={`${isMobile ? 'px-8 py-4 text-lg' : 'px-6 py-3'} bg-gray-700 rounded hover:bg-gray-600 transition-colors`}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {showLevelSelect && !isMobile && (
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