'use client'

import React from 'react'
import { DIFFICULTY_SETTINGS } from '@/lib/game/difficulty'

interface Level {
  number: number
  name: string
  targetScore: number
  asteroidSpeed: number
  spawnRate: number
  asteroidCount: number
}

interface GameMenuProps {
  highScore: number
  difficulty: 'easy' | 'medium' | 'hard'
  setDifficulty: (diff: 'easy' | 'medium' | 'hard') => void
  onStartGame: () => void
  showLevelSelect: boolean
  setShowLevelSelect: (show: boolean) => void
  levels: Level[]
  unlockedLevels: number
  onSelectLevel: (level: number) => void
}

export default function GameMenu({
  highScore,
  difficulty,
  setDifficulty,
  onStartGame,
  showLevelSelect,
  setShowLevelSelect,
  levels,
  unlockedLevels,
  onSelectLevel
}: GameMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-6xl font-bold mb-8 text-cyan-400">Star Scavenger</h1>
      <p className="text-xl mb-4">High Score: {highScore}</p>
      
      {/* Difficulty Selector */}
      <div className="mb-6 flex gap-3">
        {(['easy', 'medium', 'hard'] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => setDifficulty(diff)}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              difficulty === diff
                ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                : 'opacity-50 hover:opacity-75'
            }`}
            style={{
              backgroundColor: DIFFICULTY_SETTINGS[diff].color,
              color: '#000',
              ...(difficulty === diff ? { ringColor: DIFFICULTY_SETTINGS[diff].color } : {})
            }}
          >
            {DIFFICULTY_SETTINGS[diff].name}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-400 mb-8 max-w-md text-center">
        {DIFFICULTY_SETTINGS[difficulty].description}
      </p>

      <button
        onClick={onStartGame}
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
            {levels.map(level => (
              <button
                key={level.number}
                onClick={() => onSelectLevel(level.number)}
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