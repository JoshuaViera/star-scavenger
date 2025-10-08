// src/components/game/GameMenu.tsx
'use client'

import { useState, useEffect } from 'react'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { Leaderboard } from '@/components/game/Leaderboard'
import { gameState } from '@/lib/game-state'
import { useAuth } from '@/hooks/useAuth'

interface GameMenuProps {
  onStartGame: (level: number, difficulty: string) => void
  onResumeGame?: (savedState: any) => void
  highScore: number
}

export function GameMenu({ onStartGame, onResumeGame, highScore }: GameMenuProps) {
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadProgress()
    checkForSavedGame()
  }, [user])

  const loadProgress = async () => {
    const progress = await gameState.getProgress()
    if (progress) {
      setUnlockedLevels(progress.unlocked_levels)
      setSelectedDifficulty(progress.difficulty as any)
    }
  }

  const checkForSavedGame = async () => {
    const savedGame = await gameState.loadGame()
    setHasSavedGame(!!savedGame)
  }

  const handleStartGame = async () => {
    await gameState.updateProgress({
      current_level: selectedLevel,
      difficulty: selectedDifficulty
    })
    onStartGame(selectedLevel, selectedDifficulty)
  }

  const handleResumeGame = async () => {
    const savedGame = await gameState.loadGame()
    if (savedGame && onResumeGame) {
      onResumeGame(savedGame)
    }
  }

  const handleDeleteSave = async () => {
    if (confirm('Delete saved game? This cannot be undone.')) {
      await gameState.deleteSavedGame()
      setHasSavedGame(false)
    }
  }

  if (showLeaderboard) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black to-blue-950 p-8">
        <h1 className="mb-8 text-5xl font-bold text-white">
          🏆 Leaderboard
        </h1>
        
        <Leaderboard difficulty="all" limit={100} />
        
        <button
          onClick={() => setShowLeaderboard(false)}
          className="mt-8 rounded-lg bg-gray-800 px-8 py-3 text-lg font-semibold text-white hover:bg-gray-700"
        >
          Back to Menu
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black to-blue-950">
      {/* User Menu in Top Right */}
      <div className="absolute top-4 right-4">
        <UserMenu onLoginClick={() => setShowAuthModal(true)} />
      </div>

      {/* Title */}
      <h1 className="mb-2 text-6xl font-bold text-white">
        Star Scavenger
      </h1>
      <p className="mb-8 text-xl text-blue-300">
        Survive the asteroid storm
      </p>

      {/* High Score Display */}
      <div className="mb-8 rounded-lg bg-blue-900/50 px-6 py-3">
        <p className="text-center text-sm text-blue-300">High Score</p>
        <p className="text-center text-3xl font-bold text-yellow-400">
          {highScore.toLocaleString()}
        </p>
      </div>

      {/* Main Menu Card */}
      <div className="w-full max-w-md rounded-lg bg-gray-900/80 p-8 shadow-2xl">
        {/* Resume Game Button */}
        {hasSavedGame && (
          <div className="mb-6 space-y-2">
            <button
              onClick={handleResumeGame}
              className="w-full rounded-lg bg-green-600 px-6 py-4 text-xl font-bold text-white hover:bg-green-700 transition-colors"
            >
              ▶️ Resume Game
            </button>
            <button
              onClick={handleDeleteSave}
              className="w-full rounded bg-red-900/50 px-4 py-2 text-sm text-red-300 hover:bg-red-900/70 transition-colors"
            >
              Delete Saved Game
            </button>
          </div>
        )}

        {/* Level Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-white">
            Select Level
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => {
              const isUnlocked = unlockedLevels.includes(level)
              return (
                <button
                  key={level}
                  onClick={() => isUnlocked && setSelectedLevel(level)}
                  disabled={!isUnlocked}
                  className={`
                    rounded-lg px-4 py-3 text-lg font-bold transition-all
                    ${selectedLevel === level
                      ? 'bg-blue-600 text-white scale-110'
                      : isUnlocked
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  {level}
                  {!isUnlocked && <div className="text-xs">🔒</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-white">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`
                  rounded-lg px-4 py-2 font-semibold transition-all
                  ${selectedDifficulty === difficulty
                    ? difficulty === 'easy'
                      ? 'bg-green-600 text-white'
                      : difficulty === 'medium'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          className="w-full rounded-lg bg-blue-600 px-6 py-4 text-xl font-bold text-white hover:bg-blue-700 transition-colors mb-4"
        >
          🚀 Start Game
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={() => setShowLeaderboard(true)}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 text-lg font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          🏆 Leaderboard
        </button>

        {/* Controls Info */}
        <div className="mt-6 rounded-lg bg-gray-800 p-4">
          <p className="mb-2 text-sm font-semibold text-white">Controls:</p>
          <p className="text-xs text-gray-300">
            <span className="font-semibold">WASD</span> - Move
            <br />
            <span className="font-semibold">Mouse</span> - Aim
            <br />
            <span className="font-semibold">Left Click</span> - Shoot
            <br />
            <span className="font-semibold">P</span> - Pause
          </p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          loadProgress()
        }}
      />
    </div>
  )
}