// src/lib/game/screenShake.ts

export class ScreenShake {
  private intensity: number = 0
  private duration: number = 0
  private startTime: number = 0

  trigger(intensity: number, duration: number) {
    this.intensity = intensity
    this.duration = duration
    this.startTime = Date.now()
  }

  getOffset(): { x: number; y: number } {
    if (this.duration <= 0) return { x: 0, y: 0 }

    const elapsed = Date.now() - this.startTime
    if (elapsed >= this.duration) {
      this.duration = 0
      return { x: 0, y: 0 }
    }

    const progress = elapsed / this.duration
    const currentIntensity = this.intensity * (1 - progress)

    return {
      x: (Math.random() - 0.5) * currentIntensity,
      y: (Math.random() - 0.5) * currentIntensity
    }
  }

  isActive(): boolean {
    return this.duration > 0 && Date.now() - this.startTime < this.duration
  }
}