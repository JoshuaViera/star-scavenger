// src/lib/game/difficulty.ts

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_SETTINGS = {
  easy: {
    name: 'Easy',
    description: 'Relaxed gameplay for new players',
    asteroidSpeedMultiplier: 0.6,
    asteroidCountMultiplier: 1, // Keep same count
    asteroidSizeMin: 15, // Smaller asteroids
    asteroidSizeMax: 35,
    enemySpeedMultiplier: 0.75,
    enemyFireRateMultiplier: 1.5,
    bossHealthMultiplier: 0.7,
    bossFireRateMultiplier: 1.4,
    startWithShield: true,
    color: '#4ADE80' // green
  },
  medium: {
    name: 'Medium',
    description: 'Balanced challenge for most players',
    asteroidSpeedMultiplier: 0.85,
    asteroidCountMultiplier: 1, // Keep same count
    asteroidSizeMin: 20, // Default sizes
    asteroidSizeMax: 50,
    enemySpeedMultiplier: 0.9,
    enemyFireRateMultiplier: 1.25,
    bossHealthMultiplier: 0.85,
    bossFireRateMultiplier: 1.2,
    startWithShield: false,
    color: '#FCD34D' // yellow
  },
  hard: {
    name: 'Hard',
    description: 'Intense combat for experienced players',
    asteroidSpeedMultiplier: 1.2, // Faster asteroids!
    asteroidCountMultiplier: 1.3, // 30% MORE asteroids
    asteroidSizeMin: 25, // Bigger asteroids
    asteroidSizeMax: 60,
    enemySpeedMultiplier: 1,
    enemyFireRateMultiplier: 1,
    bossHealthMultiplier: 1,
    bossFireRateMultiplier: 1,
    startWithShield: false,
    color: '#EF4444' // red
  }
}