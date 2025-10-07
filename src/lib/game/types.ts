// src/lib/game/types.ts
export interface GameObject {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
}

export interface Player extends GameObject {
  rotation: number
  health: number
}

export interface Bullet extends GameObject {
  life: number
}

export interface Asteroid extends GameObject {
  size: number
}

export interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  type: 'speed' | 'multishot' | 'bigship' | 'shield' | 'rapidfire' | 'bomb'
  duration: number
}

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