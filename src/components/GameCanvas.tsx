// src/components/GameCanvas.tsx
'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Player, Bullet, Asteroid } from '@/lib/game/types'
import { checkCollision, randomBetween } from '@/lib/game/utils'

const PLAYER_SIZE = 20
const PLAYER_SPEED = 3
const BULLET_SPEED = 5
const BULLET_LIFESPAN = 100

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const mousePosRef = useRef({ x: 400, y: 300 })
  const gameStateRef = useRef({
    player: { x: 390, y: 290, width: PLAYER_SIZE, height: PLAYER_SIZE, vx: 0, vy: 0, rotation: 0, health: 100 },
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    score: 0,
    gameOver: false
  })

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      keysRef.current[e.key.toLowerCase()] = true 
    }
    const handleKeyUp = (e: KeyboardEvent) => { 
      keysRef.current[e.key.toLowerCase()] = false 
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        mousePosRef.current = { 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top 
        }
      }
    }
    const handleShoot = () => {
      if (gameStateRef.current.gameOver) return
      const p = gameStateRef.current.player
      gameStateRef.current.bullets.push({
        x: p.x + PLAYER_SIZE / 2,
        y: p.y + PLAYER_SIZE / 2,
        width: 4,
        height: 4,
        vx: Math.cos(p.rotation) * BULLET_SPEED,
        vy: Math.sin(p.rotation) * BULLET_SPEED,
        life: BULLET_LIFESPAN
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleShoot)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleShoot)
    }
  }, [])

  // Spawn asteroids
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (gameStateRef.current.gameOver || gameStateRef.current.asteroids.length > 15) return
      
      const size = randomBetween(20, 50)
      const edge = Math.floor(randomBetween(0, 4))
      let x, y
      
      if (edge === 0) { x = -size; y = Math.random() * 600 }
      else if (edge === 1) { x = 800 + size; y = Math.random() * 600 }
      else if (edge === 2) { y = -size; x = Math.random() * 800 }
      else { y = 600 + size; x = Math.random() * 800 }

      gameStateRef.current.asteroids.push({
        x, y, width: size, height: size, size,
        vx: randomBetween(-1, 1),
        vy: randomBetween(-1, 1)
      })
    }, 1500)
    
    return () => clearInterval(spawnInterval)
  }, [])

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    let animationFrameId: number

    const gameLoop = () => {
      const state = gameStateRef.current
      
      if (state.gameOver) {
        setGameOver(true)
        return
      }

      // Update player
      let moveX = 0, moveY = 0
      if (keysRef.current['w']) moveY -= 1
      if (keysRef.current['s']) moveY += 1
      if (keysRef.current['a']) moveX -= 1
      if (keysRef.current['d']) moveX += 1

      const mag = Math.sqrt(moveX * moveX + moveY * moveY)
      if (mag > 0) {
        state.player.x += (moveX / mag) * PLAYER_SPEED
        state.player.y += (moveY / mag) * PLAYER_SPEED
      }

      // Keep player in bounds
      state.player.x = Math.max(0, Math.min(780, state.player.x))
      state.player.y = Math.max(0, Math.min(580, state.player.y))

      // Update rotation to face mouse
      const angle = Math.atan2(
        mousePosRef.current.y - (state.player.y + PLAYER_SIZE / 2),
        mousePosRef.current.x - (state.player.x + PLAYER_SIZE / 2)
      )
      state.player.rotation = angle

      // Update bullets
      state.bullets = state.bullets
        .map(b => ({ ...b, x: b.x + b.vx, y: b.y + b.vy, life: b.life - 1 }))
        .filter(b => b.life > 0 && b.x > -10 && b.x < 810 && b.y > -10 && b.y < 610)

      // Update asteroids
      state.asteroids = state.asteroids
        .map(a => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
        .filter(a => a.x > -a.size * 2 && a.x < 800 + a.size * 2 && 
                     a.y > -a.size * 2 && a.y < 600 + a.size * 2)

      // Collision detection
      const survivingAsteroids = []
      for (const asteroid of state.asteroids) {
        let destroyed = false
        
        for (const bullet of state.bullets) {
          if (checkCollision(asteroid, bullet)) {
            destroyed = true
            bullet.life = 0
            state.score += Math.floor(asteroid.size)
            break
          }
        }

        if (checkCollision(asteroid, state.player)) {
          state.gameOver = true
        }

        if (!destroyed) {
          survivingAsteroids.push(asteroid)
        }
      }
      
      state.asteroids = survivingAsteroids
      state.bullets = state.bullets.filter(b => b.life > 0)
      setScore(state.score)

      // Render
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, 800, 600)

      // Draw player
      ctx.save()
      ctx.translate(state.player.x + PLAYER_SIZE / 2, state.player.y + PLAYER_SIZE / 2)
      ctx.rotate(state.player.rotation)
      ctx.beginPath()
      ctx.moveTo(10, 0)
      ctx.lineTo(-10, -8)
      ctx.lineTo(-10, 8)
      ctx.closePath()
      ctx.fillStyle = 'cyan'
      ctx.shadowColor = 'cyan'
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.restore()

      // Draw bullets
      state.bullets.forEach(b => {
        ctx.fillStyle = 'magenta'
        ctx.shadowColor = 'magenta'
        ctx.shadowBlur = 15
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
      })

      // Draw asteroids
      state.asteroids.forEach(a => {
        ctx.strokeStyle = 'white'
        ctx.shadowColor = 'white'
        ctx.shadowBlur = 5
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(a.x + a.size * 0.5, a.y)
        ctx.lineTo(a.x + a.size, a.y + a.size * 0.3)
        ctx.lineTo(a.x + a.size * 0.8, a.y + a.size)
        ctx.lineTo(a.x + a.size * 0.2, a.y + a.size)
        ctx.lineTo(a.x, a.y + a.size * 0.7)
        ctx.closePath()
        ctx.stroke()
      })

      // Draw score
      ctx.shadowBlur = 0
      ctx.fillStyle = 'white'
      ctx.font = '20px Arial'
      ctx.fillText(`Score: ${state.score}`, 10, 30)

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="bg-black border-2 border-cyan-700 cursor-crosshair"
      />
      {gameOver && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 flex flex-col justify-center items-center text-white">
          <h2 className="text-5xl font-bold">Game Over</h2>
          <p className="text-2xl mt-4">Final Score: {score}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-6 py-2 bg-cyan-500 rounded hover:bg-cyan-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default GameCanvas