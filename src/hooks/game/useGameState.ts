import { useRef, useState, useEffect } from 'react'
import { Bullet, Asteroid, Enemy, EnemyBullet, Boss, BossBullet } from '@/lib/game/types'
import { analytics } from '@/lib/analytics'
import { DIFFICULTY_SETTINGS } from '@/lib/game/difficulty'

const PLAYER_SIZE = 20

interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  type: 'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb'
  duration: number
}

export interface GameState {
  player: {
    x: number
    y: number
    width: number
    height: number
    vx: number
    vy: number
    rotation: number
    health: number
  }
  bullets: Bullet[]
  asteroids: Asteroid[]
  powerUps: PowerUp[]
  enemies: Enemy[]
  enemyBullets: EnemyBullet[]
  boss: Boss | null
  bossBullets: BossBullet[]
  bossActive: boolean
  bossDefeated: boolean
  score: number
  gameOver: boolean
  isPaused: boolean
  activePowerUps: {
    speed: number
    multishot: number
    bigship: number
    shield: number
    rapidfire: number
    bomb: number
  }
  currentLevel: number
  unlockedLevels: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export function useGameState() {
  const gameStateRef = useRef<GameState>({
    player: { x: 390, y: 290, width: PLAYER_SIZE, height: PLAYER_SIZE, vx: 0, vy: 0, rotation: 0, health: 100 },
    bullets: [],
    asteroids: [],
    powerUps: [],
    enemies: [],
    enemyBullets: [],
    boss: null,
    bossBullets: [],
    bossActive: false,
    bossDefeated: false,
    score: 0,
    gameOver: false,
    isPaused: false,
    activePowerUps: { speed: 0, multishot: 0, bigship: 0, shield: 0, rapidfire: 0, bomb: 0 },
    currentLevel: 1,
    unlockedLevels: 1,
    difficulty: 'medium'
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
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [showDifficultySelect, setShowDifficultySelect] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHighScore(parseInt(localStorage.getItem('starScavengerHighScore') || '0'))
    }
  }, [])

const resetGame = () => {
    // ✅ FIX: Read difficulty from ref, not state
    const currentDifficulty = gameStateRef.current.difficulty
    const diffSettings = DIFFICULTY_SETTINGS[currentDifficulty]
    
    gameStateRef.current = {
      player: { x: 390, y: 290, width: PLAYER_SIZE, height: PLAYER_SIZE, vx: 0, vy: 0, rotation: 0, health: 100 },
      bullets: [],
      asteroids: [],
      powerUps: [],
      enemies: [],
      enemyBullets: [],
      boss: null,
      bossBullets: [],
      bossActive: false,
      bossDefeated: false,
      score: 0,
      gameOver: false,
      isPaused: false,
      activePowerUps: {
        speed: 0,
        multishot: 0,
        bigship: 0,
        shield: diffSettings.startWithShield ? 8000 : 0,
        rapidfire: 0,
        bomb: 0
      },
      currentLevel: gameStateRef.current.currentLevel,
      unlockedLevels: gameStateRef.current.unlockedLevels,
      difficulty: currentDifficulty  // ✅ FIX: Use the difficulty from ref
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

  return {
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
    showDifficultySelect,
    setShowDifficultySelect,
    resetGame,
    selectLevel
  }
}