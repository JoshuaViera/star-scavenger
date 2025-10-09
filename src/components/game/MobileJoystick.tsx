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
  
  const JOYSTICK_SIZE = 140
  const JOYSTICK_RANGE = 60
  const JOYSTICK_BASE_X = 90
  const JOYSTICK_BASE_Y = window.innerHeight - 150

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const x = touch.clientX
        const y = touch.clientY

        const distanceFromJoystick = Math.sqrt(
          Math.pow(x - JOYSTICK_BASE_X, 2) + Math.pow(y - JOYSTICK_BASE_Y, 2)
        )

        // If touching joystick area and no joystick is active
        if (distanceFromJoystick < 100 && touchIdRef.current === null) {
          e.preventDefault()
          e.stopPropagation()
          touchIdRef.current = touch.identifier
          setJoystickPosition({ x: JOYSTICK_BASE_X, y: JOYSTICK_BASE_Y })
          setJoystickActive(true)
        } 
        // ✅ FIX: Allow shooting even if joystick is active (different touch)
        else if (touch.identifier !== touchIdRef.current) {
          // This is a different finger - allow shooting
          onShoot(x, y)
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        
        if (touch.identifier === touchIdRef.current) {
          e.preventDefault()
          e.stopPropagation()
          
          const x = touch.clientX
          const y = touch.clientY
          const dx = x - JOYSTICK_BASE_X
          const dy = y - JOYSTICK_BASE_Y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > JOYSTICK_RANGE) {
            const angle = Math.atan2(dy, dx)
            setJoystickPosition({
              x: JOYSTICK_BASE_X + Math.cos(angle) * JOYSTICK_RANGE,
              y: JOYSTICK_BASE_Y + Math.sin(angle) * JOYSTICK_RANGE
            })
          } else {
            setJoystickPosition({ x, y })
          }

          const normalizedX = Math.max(-1, Math.min(1, dx / JOYSTICK_RANGE))
          const normalizedY = Math.max(-1, Math.min(1, dy / JOYSTICK_RANGE))
          onMove(normalizedX, normalizedY)
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        
        if (touch.identifier === touchIdRef.current) {
          e.preventDefault()
          e.stopPropagation()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMove, onShoot])

  return (
    <div className="fixed left-0 bottom-0 z-40 pointer-events-none" style={{ width: 200, height: 200 }}>
      {/* Joystick Base */}
      <div
        className="absolute"
        style={{
          left: JOYSTICK_BASE_X - JOYSTICK_SIZE / 2,
          bottom: 150,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: '3px solid rgba(255, 255, 255, 0.4)',
          pointerEvents: 'auto'
        }}
      />
      
      {/* Joystick Stick */}
      <div
        style={{
          position: 'absolute',
          left: joystickPosition.x - 35,
          bottom: window.innerHeight - joystickPosition.y - 35,
          width: 70,
          height: 70,
          borderRadius: '50%',
          backgroundColor: joystickActive 
            ? 'rgba(59, 130, 246, 0.9)' 
            : 'rgba(59, 130, 246, 0.6)',
          border: '4px solid rgba(255, 255, 255, 0.9)',
          pointerEvents: 'auto',
          transition: joystickActive ? 'none' : 'all 0.2s ease',
          boxShadow: joystickActive 
            ? '0 0 25px rgba(59, 130, 246, 0.8)' 
            : 'none'
        }}
      />
      
      {/* Label */}
      <div
        className="absolute text-white/60 text-sm font-medium"
        style={{
          left: 35,
          bottom: 10,
          pointerEvents: 'none'
        }}
      >
        Move
      </div>
    </div>
  )
}