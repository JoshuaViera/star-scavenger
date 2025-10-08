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
  const touchIdRef = useRef<number | null>(null)

  const JOYSTICK_SIZE = 120
  const JOYSTICK_RANGE = 50
  // Fixed position: bottom-left corner
  const JOYSTICK_BASE_X = 80
  const JOYSTICK_BASE_Y = window.innerHeight - 120

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const x = touch.clientX
        const y = touch.clientY

        // Check if touch is within joystick area (bottom-left 150px radius)
        const distanceFromJoystick = Math.sqrt(
          Math.pow(x - JOYSTICK_BASE_X, 2) + Math.pow(y - JOYSTICK_BASE_Y, 2)
        )

        if (distanceFromJoystick < 100 && touchIdRef.current === null) {
          // Touch is on joystick
          e.preventDefault()
          touchIdRef.current = touch.identifier
          setJoystickPosition({ x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y })
          setJoystickActive(true)
        } else {
          // Touch is on canvas - shoot at that location
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
          const dx = x - JOYSTICK_BASE_X
          const dy = y - JOYSTICK_BASE_Y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Clamp to range
          if (distance > JOYSTICK_RANGE) {
            const angle = Math.atan2(dy, dx)
            setJoystickPosition({
              x: JOYSTICK_BASE_X + Math.cos(angle) * JOYSTICK_RANGE,
              y: JOYSTICK_BASE_Y + Math.sin(angle) * JOYSTICK_RANGE
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
          setJoystickPosition({ x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y })
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
  }, [onMove, onShoot])

  return (
    <>
      {/* Joystick Base - Always visible */}
      <div
        style={{
          position: 'fixed',
          left: JOYSTICK_BASE_X - JOYSTICK_SIZE / 2,
          bottom: 120,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: '3px solid rgba(255, 255, 255, 0.4)',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      />
      
      {/* Joystick Stick */}
      <div
        style={{
          position: 'fixed',
          left: joystickPosition.x - 30,
          bottom: window.innerHeight - joystickPosition.y - 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: joystickActive 
            ? 'rgba(59, 130, 246, 0.9)' 
            : 'rgba(59, 130, 246, 0.6)',
          border: '3px solid rgba(255, 255, 255, 0.9)',
          pointerEvents: 'none',
          zIndex: 1001,
          transition: joystickActive ? 'none' : 'all 0.2s ease',
          boxShadow: joystickActive 
            ? '0 0 20px rgba(59, 130, 246, 0.6)' 
            : 'none'
        }}
      />

      {/* Instruction Text */}
      <div
        style={{
          position: 'fixed',
          left: 20,
          bottom: 20,
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 999,
          textShadow: '0 0 4px black'
        }}
      >
        Move
      </div>
    </>
  )
}