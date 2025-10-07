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
    health: 2,           // Was 1, now 2
    speed: 1.8,          // Was 2.5, now slower
    size: 25,            // Was 15, now bigger
    fireRate: 2500,      // Was 2000, now shoots slower
    bulletSpeed: 2.5,    // Was 3, now slower bullets
    points: 50,
    color: 'lime'
  },
  fighter: {
    health: 3,           // Was 2, now 3
    speed: 1.2,          // Was 1.5, now slower
    size: 30,            // Was 20, now bigger
    fireRate: 2000,      // Was 1500, now shoots slower
    bulletSpeed: 3,      // Was 4, now slower bullets
    points: 100,
    color: 'orange'
  },
  bomber: {
    health: 5,           // Was 4, now 5
    speed: 0.6,          // Was 0.8, now slower
    size: 40,            // Was 30, now bigger
    fireRate: 1500,      // Was 1000, now shoots slower
    bulletSpeed: 2,      // Was 2.5, now slower bullets
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