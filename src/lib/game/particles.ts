// src/lib/game/particles.ts

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export class ParticleSystem {
  particles: Particle[] = []

  createExplosion(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 2 + Math.random() * 3
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 30 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        color
      })
    }
  }

  update() {
    this.particles = this.particles
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1, // gravity
        life: p.life - 1
      }))
      .filter(p => p.life > 0)
  }

  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.globalAlpha = alpha
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    })
    ctx.globalAlpha = 1
  }
}