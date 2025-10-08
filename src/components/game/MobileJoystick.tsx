// src/components/game/MobileJoystick.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface MobileJoystickProps {
  onMove: (x: number, y: number) => void
  onShoot: (x: number, y: number) => void
}

export function MobileJoystick({ onMove, onShoot }: MobileJoystickProps) {
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 })
  const joystickRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)

  const JOYSTICK_SIZE = 120
  const JOYSTICK_RANGE = 50

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const x = touch.clientX
        const y = touch.clientY

        // Left half of screen = joystick
        if (x < window.innerWidth / 2) {
          if (touchIdRef.current === null) {
            e.preventDefault()
            touchIdRef.current = touch.identifier
            setJoystickBase({ x, y })
            setJoystickPosition({ x, y })
            setJoystickActive(true)
          }
        } 
        // Right half of screen = shoot
        else {
          e.preventDefault()
          onShoot(x, y)
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        
        if (touch.identifier === touchIdRef.current) {
          e.preventDefault()
          const x = touch.clientX
          const y = touch.clientY

          // Calculate distance from base
          const dx = x - joystickBase.x
          const dy = y - joystickBase.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Clamp to range
          if (distance > JOYSTICK_RANGE) {
            const angle = Math.atan2(dy, dx)
            setJoystickPosition({
              x: joystickBase.x + Math.cos(angle) * JOYSTICK_RANGE,
              y: joystickBase.y + Math.sin(angle) * JOYSTICK_RANGE
            })
          } else {
            setJoystickPosition({ x, y })
          }

          // Send normalized movement (-1 to 1)
          const normalizedX = dx / JOYSTICK_RANGE
          const normalizedY = dy / JOYSTICK_RANGE
          onMove(normalizedX, normalizedY)
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        
        if (touch.identifier === touchIdRef.current) {
          e.preventDefault()
          touchIdRef.current = null
          setJoystickActive(false)
          onMove(0, 0)
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [joystickBase, onMove, onShoot])

  if (!joystickActive) return null

  return (
    <>
      {/* Joystick Base */}
      <div
        ref={joystickRef}
        style={{
          position: 'fixed',
          left: joystickBase.x - JOYSTICK_SIZE / 2,
          top: joystickBase.y - JOYSTICK_SIZE / 2,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      />
      
      {/* Joystick Stick */}
      <div
        style={{
          position: 'fixed',
          left: joystickPosition.x - 30,
          top: joystickPosition.y - 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          border: '3px solid rgba(255, 255, 255, 0.8)',
          pointerEvents: 'none',
          zIndex: 1001,
          transition: 'none'
        }}
      />
    </>
  )
}