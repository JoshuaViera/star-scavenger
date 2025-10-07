'use client'

import React, { useRef } from 'react'
import { useEffect } from 'react'
import { musicManager } from '@/lib/game/music'
import { soundManager } from '@/lib/game/sounds'
import { analytics } from '@/lib/analytics'
import GameMenu from './game/GameMenu'
import { useGameState } from '@/hooks/game/useGameState'
import { useGameSystems } from '@/hooks/game/useGameSystems'
import { useInputHandlers } from '@/hooks/game/useInputHandlers'
import { useAsteroidSpawning } from '@/hooks/game/useAsteroidSpawning'
import { usePowerUpSpawning } from '@/hooks/game/usePowerUpSpawning'
import { useEnemySpawning } from '@/hooks/game/useEnemySpawning'
import { useGameLoop } from '@/hooks/game/useGameLoop'

const LEVELS = [
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

  // Input handlers
  useInputHandlers(
    gameStateRef,
    keysRef,
    mousePosRef,
    lastShotTime,
    particles,
    screenShake,
    canvasRef,
    gameStarted,
    gameOver,
    setIsPaused
  )

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

  // Music management
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

  // Main menu
  if (!gameStarted) {
    return (
      <GameMenu
        highScore={highScore}
        difficulty={difficulty}
        setDifficulty={(diff: 'easy' | 'medium' | 'hard') => {
          setDifficulty(diff)
          gameStateRef.current.difficulty = diff
        }}
        onStartGame={() => setGameStarted(true)}
        showLevelSelect={showLevelSelect}
        setShowLevelSelect={setShowLevelSelect}
        levels={LEVELS}
        unlockedLevels={unlockedLevels}
        onSelectLevel={selectLevel}
      />
    )
  }

  // Game UI
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