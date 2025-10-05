// src/components/GameCanvas.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Player, Bullet, Asteroid } from '@/lib/game/types';
import { checkCollision, randomBetween } from '@/lib/game/utils';

// Game Constants
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 3;
const BULLET_SPEED = 5;
const BULLET_LIFESPAN = 100;

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  const [player, setPlayer] = useState<Player>({
    x: 390, y: 290, width: PLAYER_SIZE, height: PLAYER_SIZE,
    vx: 0, vy: 0, rotation: 0, health: 100
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // === INPUT HANDLING ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    const handleShoot = () => {
        if (gameOver) return;
        setBullets(prev => [
            ...prev,
            { 
                x: player.x + PLAYER_SIZE / 2, y: player.y + PLAYER_SIZE / 2, 
                width: 4, height: 4,
                vx: Math.cos(player.rotation) * BULLET_SPEED,
                vy: Math.sin(player.rotation) * BULLET_SPEED,
                life: BULLET_LIFESPAN
            }
        ]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleShoot);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleShoot);
    };
  }, [player, gameOver]);

  // Spawn asteroids periodically
  useEffect(() => {
    const spawnInterval = setInterval(() => {
        if (gameOver) return;
        const size = randomBetween(20, 50);
        const edge = Math.floor(randomBetween(0, 4));
        let x, y;
        if (edge === 0) { x = 0; y = Math.random() * 600; } // left
        else if (edge === 1) { x = 800; y = Math.random() * 600; } // right
        else if (edge === 2) { y = 0; x = Math.random() * 800; } // top
        else { y = 600; x = Math.random() * 800; } // bottom

        setAsteroids(prev => [
            ...prev, 
            {
                x, y, width: size, height: size, size,
                vx: randomBetween(-1, 1),
                vy: randomBetween(-1, 1)
            }
        ]);
    }, 2000);
    return () => clearInterval(spawnInterval);
  }, [gameOver]);


  // === GAME LOOP ===
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || gameOver) return;

    let animationFrameId: number;

    const gameLoop = () => {
      // --- UPDATE LOGIC ---
      // Player movement (8-directional)
      const newPlayer = { ...player };
      let moveX = 0;
      let moveY = 0;
      if (keysRef.current['w']) moveY -= 1;
      if (keysRef.current['s']) moveY += 1;
      if (keysRef.current['a']) moveX -= 1;
      if (keysRef.current['d']) moveX += 1;
      
      const mag = Math.sqrt(moveX * moveX + moveY * moveY);
      if (mag > 0) {
        newPlayer.x += (moveX / mag) * PLAYER_SPEED;
        newPlayer.y += (moveY / mag) * PLAYER_SPEED;
      }

      // Bullets update
      const updatedBullets = bullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1}))
        .filter(b => b.life > 0 && b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600);

      // Asteroids update
      const updatedAsteroids = asteroids.map(a => ({
        ...a,
        x: a.x + a.vx,
        y: a.y + a.vy,
      }));

      // --- COLLISION DETECTION ---
      let newScore = score;
      const survivingAsteroids = [];
      for (const asteroid of updatedAsteroids) {
          let destroyed = false;
          for (const bullet of updatedBullets) {
              if (checkCollision(asteroid, bullet)) {
                  destroyed = true;
                  // Remove the bullet
                  bullet.life = 0;
                  newScore += Math.floor(asteroid.size);
                  break;
              }
          }
          if (!destroyed) {
              survivingAsteroids.push(asteroid);
              if (checkCollision(asteroid, newPlayer)) {
                  setGameOver(true);
              }
          }
      }
      
      setPlayer(newPlayer);
      setBullets(updatedBullets.filter(b => b.life > 0));
      setAsteroids(survivingAsteroids);
      setScore(newScore);

      // --- RENDER LOGIC ---
      context.clearRect(0, 0, 800, 600);
      
      // Draw player (a triangle)
      context.save();
      context.translate(newPlayer.x + PLAYER_SIZE / 2, newPlayer.y + PLAYER_SIZE / 2);
      // context.rotate(newPlayer.rotation); // Add rotation if you want
      context.beginPath();
      context.moveTo(10, 0);
      context.lineTo(-10, -7);
      context.lineTo(-10, 7);
      context.closePath();
      context.fillStyle = 'cyan';
      context.shadowColor = 'cyan';
      context.shadowBlur = 10;
      context.fill();
      context.restore();

      // Draw bullets
      updatedBullets.forEach(b => {
        context.fillStyle = 'magenta';
        context.shadowColor = 'magenta';
        context.shadowBlur = 15;
        context.fillRect(b.x, b.y, b.width, b.height);
      });
      
      // Draw asteroids (polygons)
      survivingAsteroids.forEach(a => {
        context.strokeStyle = 'white';
        context.shadowColor = 'white';
        context.shadowBlur = 5;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(a.x + a.size / 2, a.y);
        context.lineTo(a.x + a.size, a.y + a.size / 2);
        context.lineTo(a.x + a.size / 2, a.y + a.size);
        context.lineTo(a.x, a.y + a.size / 2);
        context.closePath();
        context.stroke();
      });

      // Draw Score
      context.fillStyle = 'white';
      context.font = '20px Arial';
      context.fillText(`Score: ${newScore}`, 10, 30);
      
      animationFrameId = window.requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [player, bullets, asteroids, score, gameOver]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={800} height={600} className="bg-black" />
      {gameOver && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex flex-col justify-center items-center text-white">
              <h2 className="text-5xl font-bold">Game Over</h2>
              <p className="text-2xl mt-4">Final Score: {score}</p>
              <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-cyan-500 rounded hover:bg-cyan-600">
                  Play Again
              </button>
          </div>
      )}
    </div>
  );
};

export default GameCanvas;