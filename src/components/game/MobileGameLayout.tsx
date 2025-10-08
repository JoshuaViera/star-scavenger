// src/components/game/MobileGameLayout.tsx
'use client'

import { RefObject } from 'react'
import { MobileJoystick } from './MobileJoystick'
import { MobileBombButton } from './MobileBombButton'

interface MobileGameLayoutProps {
  canvasRef: RefObject<HTMLCanvasElement | null>  // ✅ FIXED: Added | null
  score: number
  isPaused: boolean
  hasBomb: boolean
  onPause: () => void
  onBomb: () => void
  onMove: (x: number, y: number) => void
  onShoot: (x: number, y: number) => void
}

export function MobileGameLayout({
  canvasRef,
  score,
  isPaused,
  hasBomb,
  onPause,
  onBomb,
  onMove,
  onShoot
}: MobileGameLayoutProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        {/* Score */}
        <div className="text-white">
          <div className="text-xs opacity-70">Score</div>
          <div className="text-2xl font-bold">{score.toLocaleString()}</div>
        </div>
        
        {/* Pause Button */}
        <button
          onClick={onPause}
          className="px-8 py-4 bg-yellow-500 rounded-lg text-white font-bold text-lg active:bg-yellow-600 shadow-lg"
          style={{ touchAction: 'manipulation' }}
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>
      </div>

      {/* Game Canvas - Centered and Properly Sized */}
      <div className="flex-1 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="bg-black border-2 border-cyan-700 max-w-full max-h-full"
          style={{
            touchAction: 'none',
            width: '100%',
            height: 'auto',
            aspectRatio: '4/3'
          }}
        />
      </div>

      {/* Mobile Controls - Only show when not paused */}
      {!isPaused && (
        <>
          {/* Joystick */}
          <MobileJoystick onMove={onMove} onShoot={onShoot} />
          
          {/* Bomb Button */}
          <MobileBombButton hasBomb={hasBomb} onBomb={onBomb} />
          
          {/* Instructions */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/50 text-sm pointer-events-none z-10">
            Tap screen to shoot
          </div>
        </>
      )}
    </div>
  )
}