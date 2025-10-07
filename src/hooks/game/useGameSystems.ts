import { useRef } from 'react'
import { ScreenShake } from '@/lib/game/screenShake'
import { ParticleSystem } from '@/lib/game/particles'
import { Starfield } from '@/lib/game/starfield'

export function useGameSystems() {
  const screenShakeRef = useRef(new ScreenShake())
  const particleSystemRef = useRef(new ParticleSystem())
  const starfieldRef = useRef(new Starfield(100))
  const lastShotTimeRef = useRef(0)

  return {
    screenShake: screenShakeRef,
    particles: particleSystemRef,
    starfield: starfieldRef,
    lastShotTime: lastShotTimeRef
  }
}