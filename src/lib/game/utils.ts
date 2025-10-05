// src/lib/game/utils.ts
import { GameObject } from './types';

export function checkCollision(obj1: GameObject, obj2: GameObject): boolean {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}