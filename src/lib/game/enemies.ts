// src/lib/game/enemies.ts

export interface Enemy {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  health: number
  type: 'scout' | 'fighter' | 'bomber'
  lastShot: number
  rotation: number
}

export interface EnemyBullet {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  life: number
}

export const ENEMY_TYPES = {
  scout: {
    health: 1,
    speed: 2.5,
    size: 15,
    fireRate: 2000,
    bulletSpeed: 3,
    points: 50,
    color: 'lime'
  },
  fighter: {
    health: 2,
    speed: 1.5,
    size: 20,
    fireRate: 1500,
    bulletSpeed: 4,
    points: 100,
    color: 'orange'
  },
  bomber: {
    health: 4,
    speed: 0.8,
    size: 30,
    fireRate: 1000,
    bulletSpeed: 2.5,
    points: 200,
    color: 'red'
  }
}

export function createEnemy(type: 'scout' | 'fighter' | 'bomber', playerX: number, playerY: number): Enemy {
  const config = ENEMY_TYPES[type]
  
  // Spawn from edges
  const edge = Math.floor(Math.random() * 4)
  let x, y
  
  if (edge === 0) { x = -config.size; y = Math.random() * 600 }
  else if (edge === 1) { x = 800 + config.size; y = Math.random() * 600 }
  else if (edge === 2) { y = -config.size; x = Math.random() * 800 }
  else { y = 600 + config.size; x = Math.random() * 800 }
  
  // Calculate velocity toward player
  const angle = Math.atan2(playerY - y, playerX - x)
  const vx = Math.cos(angle) * config.speed
  const vy = Math.sin(angle) * config.speed
  
  return {
    x,
    y,
    width: config.size,
    height: config.size,
    vx,
    vy,
    health: config.health,
    type,
    lastShot: Date.now(),
    rotation: angle
  }
}