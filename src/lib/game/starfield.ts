// src/lib/game/starfield.ts

interface Star {
  x: number
  y: number
  size: number
  speed: number
  brightness: number
}

export class Starfield {
  private stars: Star[] = []

  constructor(count: number) {
    for (let i = 0; i < count; i++) {
      this.stars.push(this.createStar())
    }
  }

  private createStar(): Star {
    return {
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 2,
      speed: 0.2 + Math.random() * 0.8,
      brightness: 0.3 + Math.random() * 0.7
    }
  }

  update() {
    this.stars.forEach(star => {
      star.y += star.speed
      if (star.y > 600) {
        star.y = 0
        star.x = Math.random() * 800
      }
    })
  }

  render(ctx: CanvasRenderingContext2D) {
    this.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
      ctx.fillRect(star.x, star.y, star.size, star.size)
    })
  }
}