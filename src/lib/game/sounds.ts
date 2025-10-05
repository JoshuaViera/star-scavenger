// src/lib/game/sounds.ts

class SoundManager {
  private audioContext: AudioContext | null = null
  private masterVolume: number = 0.3
  private muted: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private createOscillator(freq: number, type: OscillatorType, duration: number, volume: number = 1) {
    if (!this.audioContext || this.muted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = type
    osc.frequency.value = freq
    
    gain.gain.value = this.masterVolume * volume
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.start()
    osc.stop(this.audioContext.currentTime + duration)
  }

  shoot() {
    if (!this.audioContext || this.muted) return
    
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.value = 800
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1)

    gain.gain.value = this.masterVolume * 0.3
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.1)
  }

  explosion() {
    if (!this.audioContext || this.muted) return

    const noise = this.audioContext.createBufferSource()
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1
    }

    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3)

    const gain = this.audioContext.createGain()
    gain.gain.value = this.masterVolume * 0.5
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.audioContext.destination)

    noise.start()
    noise.stop(this.audioContext.currentTime + 0.3)
  }

  powerUp() {
    if (!this.audioContext || this.muted) return

    const times = [0, 0.1, 0.2]
    const freqs = [400, 600, 800]

    times.forEach((time, i) => {
      setTimeout(() => {
        this.createOscillator(freqs[i], 'sine', 0.15, 0.4)
      }, time * 1000)
    })
  }

  collision() {
    if (!this.audioContext || this.muted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.value = 100
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5)

    gain.gain.value = this.masterVolume * 0.6
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.5)
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }

  isMuted() {
    return this.muted
  }
}

export const soundManager = new SoundManager()