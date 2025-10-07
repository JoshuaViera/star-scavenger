// src/lib/game/bosses.ts

export interface Boss {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  health: number
  maxHealth: number
  type: 'asteroid_king' | 'void_hunter' | 'meteor_lord' | 'chaos_titan' | 'gauntlet_overlord'
  lastShot: number
  phase: number
  rotation: number
}

export interface BossBullet {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  life: number
  pattern: 'direct' | 'spiral' | 'spread'
}

export const BOSS_TYPES = {
  asteroid_king: {
    name: 'Asteroid King',
    health: 50,
    size: 80,
    speed: 1,
    fireRate: 1000,
    bulletSpeed: 3,
    color: '#FFD700',
    phases: 3
  },
  void_hunter: {
    name: 'Void Hunter',
    health: 80,
    size: 90,
    speed: 1.2,
    fireRate: 800,
    bulletSpeed: 3.5,
    color: '#8B00FF',
    phases: 3
  },
  meteor_lord: {
    name: 'Meteor Lord',
    health: 120,
    size: 100,
    speed: 0.8,
    fireRate: 600,
    bulletSpeed: 4,
    color: '#FF4500',
    phases: 4
  },
  chaos_titan: {
    name: 'Chaos Titan',
    health: 180,
    size: 110,
    speed: 1.5,
    fireRate: 500,
    bulletSpeed: 4.5,
    color: '#DC143C',
    phases: 4
  },
  gauntlet_overlord: {
    name: 'Gauntlet Overlord',
    health: 250,
    size: 120,
    speed: 2,
    fireRate: 400,
    bulletSpeed: 5,
    color: '#FF0000',
    phases: 5
  }
}

export function createBoss(type: 'asteroid_king' | 'void_hunter' | 'meteor_lord' | 'chaos_titan' | 'gauntlet_overlord'): Boss {
  const config = BOSS_TYPES[type]
  
  return {
    x: 400 - config.size / 2,
    y: 100,
    width: config.size,
    height: config.size,
    vx: config.speed,
    vy: 0,
    health: config.health,
    maxHealth: config.health,
    type,
    lastShot: Date.now(),
    phase: 1,
    rotation: 0
  }
}

export function getBossPhase(boss: Boss): number {
  const healthPercent = boss.health / boss.maxHealth
  const config = BOSS_TYPES[boss.type]
  
  if (healthPercent > 0.66) return 1
  if (healthPercent > 0.33) return 2
  if (config.phases >= 4 && healthPercent > 0.15) return 3
  if (config.phases >= 5 && healthPercent > 0.05) return 4
  return config.phases
}