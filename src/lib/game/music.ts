// src/lib/game/music.ts

class MusicManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private oscillators: OscillatorNode[] = []
  private isPlaying: boolean = false
  private isMuted: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.15
      this.masterGain.connect(this.audioContext.destination)
    }
  }

  start() {
    if (!this.audioContext || !this.masterGain || this.isPlaying || this.isMuted) return

    this.isPlaying = true

    // Chord progression: Am - F - C - G
    const chords = [
      [220, 262, 330], // Am
      [175, 220, 262], // F
      [131, 165, 196], // C
      [196, 247, 294]  // G
    ]

    let chordIndex = 0
    const chordDuration = 4000 // 4 seconds per chord

    const playChord = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return

      // Stop previous oscillators
      this.oscillators.forEach(osc => {
        try {
          osc.stop()
        } catch (e) {
          // Ignore if already stopped
        }
      })
      this.oscillators = []

      const chord = chords[chordIndex]
      chord.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq

        gain.gain.value = 0
        gain.gain.linearRampToValueAtTime(0.1, this.audioContext!.currentTime + 0.5)
        gain.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + chordDuration / 1000 - 0.5)

        osc.connect(gain)
        gain.connect(this.masterGain!)

        osc.start()
        osc.stop(this.audioContext!.currentTime + chordDuration / 1000)

        this.oscillators.push(osc)
      })

      chordIndex = (chordIndex + 1) % chords.length
    }

    playChord()
    const intervalId = setInterval(playChord, chordDuration)

    // Store interval ID for cleanup
    ;(this as any).intervalId = intervalId
  }

  stop() {
    this.isPlaying = false
    if ((this as any).intervalId) {
      clearInterval((this as any).intervalId)
    }
    this.oscillators.forEach(osc => {
      try {
        osc.stop()
      } catch (e) {
        // Ignore
      }
    })
    this.oscillators = []
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      this.stop()
    } else if (!this.isPlaying) {
      this.start()
    }
    return this.isMuted
  }

  setVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  isMusicMuted() {
    return this.isMuted
  }
}

export const musicManager = new MusicManager()