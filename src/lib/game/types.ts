// src/lib/game/types.ts
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number; // velocity x
  vy: number; // velocity y
}

export interface Player extends GameObject {
  rotation: number;
  health: number;
}

export interface Bullet extends GameObject {
  life: number;
}

export interface Asteroid extends GameObject {
  size: number;
}