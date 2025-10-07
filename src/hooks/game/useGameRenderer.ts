// src/hooks/game/useGameRenderer.ts
import { GameState } from './useGameState'
import { ENEMY_TYPES } from '@/lib/game/enemies'
import { BOSS_TYPES } from '@/lib/game/bosses'
import { ParticleSystem } from '@/lib/game/particles'
import { Starfield } from '@/lib/game/starfield'
import { ScreenShake } from '@/lib/game/screenShake'
import { DIFFICULTY_SETTINGS } from '@/lib/game/difficulty'

const PLAYER_SIZE = 20

interface Level {
  number: number
  name: string
  targetScore: number
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  level: Level,
  highScore: number,
  particleSystem: ParticleSystem,
  starfield: Starfield,
  screenShake: ScreenShake
) {
  // Clear and render background
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, 800, 600)
  starfield.render(ctx)
  const shakeOffset = screenShake.getOffset()
  ctx.save()
  ctx.translate(shakeOffset.x, shakeOffset.y)

  // Render player ship
  const shipSize = state.activePowerUps.bigship > 0 ? 1.5 : 1
  ctx.save()
  ctx.translate(state.player.x + PLAYER_SIZE / 2, state.player.y + PLAYER_SIZE / 2)
  ctx.rotate(state.player.rotation)
  ctx.scale(shipSize, shipSize)
  ctx.beginPath()
  ctx.moveTo(10, 0)
  ctx.lineTo(-10, -8)
  ctx.lineTo(-10, 8)
  ctx.closePath()
  const shipColor = state.activePowerUps.bigship > 0 ? 'gold' :
    state.activePowerUps.shield > 0 ? 'blue' : 'cyan'
  ctx.fillStyle = shipColor
  ctx.shadowColor = shipColor
  ctx.shadowBlur = 10
  ctx.fill()
  if (state.activePowerUps.shield > 0) {
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.restore()

  // Render bullets
  state.bullets.forEach(b => {
    const bulletColor = state.activePowerUps.speed > 0 ? 'yellow' :
      state.activePowerUps.rapidfire > 0 ? 'red' : 'magenta'
    ctx.fillStyle = bulletColor
    ctx.shadowColor = bulletColor
    ctx.shadowBlur = 15
    ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
  })

  // Render asteroids
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

  particleSystem.render(ctx)

  // Render enemies
  state.enemies.forEach(enemy => {
    const config = ENEMY_TYPES[enemy.type]
    ctx.save()
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
    ctx.rotate(enemy.rotation)
    ctx.fillStyle = config.color
    ctx.shadowColor = config.color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(enemy.width / 2, 0)
    ctx.lineTo(-enemy.width / 2, -enemy.height / 3)
    ctx.lineTo(-enemy.width / 3, 0)
    ctx.lineTo(-enemy.width / 2, enemy.height / 3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    if (enemy.health < ENEMY_TYPES[enemy.type].health) {
      const healthPercent = enemy.health / ENEMY_TYPES[enemy.type].health
      ctx.fillStyle = 'red'
      ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 3)
      ctx.fillStyle = 'lime'
      ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 3)
    }
  })

  // Render boss
  if (state.boss) {
    const boss = state.boss
    const config = BOSS_TYPES[boss.type]
    ctx.save()
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2)
    ctx.rotate(boss.rotation)
    ctx.fillStyle = config.color
    ctx.shadowColor = config.color
    ctx.shadowBlur = 20
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = Math.cos(angle) * (boss.width / 2)
      const y = Math.sin(angle) * (boss.height / 2)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    const healthPercent = boss.health / boss.maxHealth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(150, 20, 500, 30)
    ctx.fillStyle = 'red'
    ctx.fillRect(155, 25, 490, 20)
    ctx.fillStyle = 'lime'
    ctx.fillRect(155, 25, 490 * healthPercent, 20)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${config.name} - Phase ${boss.phase}`, 400, 40)
    ctx.textAlign = 'left'
  }

  // Render boss bullets
  state.bossBullets.forEach(b => {
    const color = b.pattern === 'spiral' ? '#FF00FF' : b.pattern === 'spread' ? '#FF8800' : '#FF0000'
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.fillRect(b.x - 4, b.y - 4, 8, 8)
  })

  // Render enemy bullets
  ctx.fillStyle = 'red'
  ctx.shadowColor = 'red'
  ctx.shadowBlur = 10
  state.enemyBullets.forEach(b => {
    ctx.fillRect(b.x - 3, b.y - 3, 6, 6)
  })
  ctx.shadowBlur = 0

  // Render power-ups
  const powerUpColors = {
    speed: 'yellow', multishot: 'orange', bigship: 'gold',
    shield: 'blue', rapidfire: 'red', bomb: 'purple'
  }
  const powerUpLetters = {
    speed: 'S', multishot: 'M', bigship: 'B',
    shield: 'H', rapidfire: 'R', bomb: 'X'
  }
  state.powerUps.forEach(p => {
    ctx.fillStyle = powerUpColors[p.type]
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 20
    ctx.fillRect(p.x, p.y, p.width, p.height)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'black'
    ctx.font = 'bold 10px Arial'
    ctx.fillText(powerUpLetters[p.type], p.x + 8, p.y + 17)
  })

  // Render HUD
  ctx.shadowBlur = 0
  ctx.fillStyle = 'white'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(`Level ${state.currentLevel}: ${level.name}`, 10, 30)
  ctx.fillText(`Score: ${state.score} / ${level.targetScore}`, 10, 55)
  ctx.fillText(`High Score: ${highScore}`, 10, 80)

  // Add difficulty indicator
  const diffSettings = DIFFICULTY_SETTINGS[state.difficulty]
  ctx.fillStyle = diffSettings.color
  ctx.font = 'bold 14px Arial'
  ctx.fillText(`${diffSettings.name} Mode`, 10, 100)

  // Power-up timers
  let powerUpY = 125
  ctx.font = 'bold 20px Arial'
  if (state.activePowerUps.speed > 0) {
    ctx.fillStyle = 'yellow'
    ctx.fillText(`Speed: ${Math.ceil(state.activePowerUps.speed / 1000)}s`, 10, powerUpY)
    powerUpY += 25
  }
  if (state.activePowerUps.multishot > 0) {
    ctx.fillStyle = 'orange'
    ctx.fillText(`Multi-Shot: ${Math.ceil(state.activePowerUps.multishot / 1000)}s`, 10, powerUpY)
    powerUpY += 25
  }
  if (state.activePowerUps.bigship > 0) {
    ctx.fillStyle = 'gold'
    ctx.fillText(`Big Ship: ${Math.ceil(state.activePowerUps.bigship / 1000)}s`, 10, powerUpY)
    powerUpY += 25
  }
  if (state.activePowerUps.shield > 0) {
    ctx.fillStyle = 'blue'
    ctx.fillText(`Shield: ${Math.ceil(state.activePowerUps.shield / 1000)}s`, 10, powerUpY)
    powerUpY += 25
  }
  if (state.activePowerUps.rapidfire > 0) {
    ctx.fillStyle = 'red'
    ctx.fillText(`Rapid-Fire: ${Math.ceil(state.activePowerUps.rapidfire / 1000)}s`, 10, powerUpY)
    powerUpY += 25
  }
  if (state.activePowerUps.bomb > 0) {
    ctx.fillStyle = 'purple'
    ctx.fillText(`BOMB Ready! (SPACE)`, 10, powerUpY)
  }

  ctx.restore()
}