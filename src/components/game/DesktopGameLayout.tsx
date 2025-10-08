// src/components/game/DesktopGameLayout.tsx
'use client'

import { RefObject } from 'react'

interface DesktopGameLayoutProps {
  canvasRef: RefObject<HTMLCanvasElement | null>  // ✅ FIXED: Added | null
  isPaused: boolean
  isMuted: boolean
  isMusicMuted: boolean
  onPause: () => void
  onMuteSound: () => void
  onMuteMusic: () => void
  onShowLevelSelect: () => void
}

export function DesktopGameLayout({
  canvasRef,
  isPaused,
  isMuted,
  isMusicMuted,
  onPause,
  onMuteSound,
  onMuteMusic,
  onShowLevelSelect
}: DesktopGameLayoutProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900">
      {/* Desktop Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={onPause}
          className="px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={onMuteSound}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={onMuteMusic}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          {isMusicMuted ? '🎵' : '🎶'}
        </button>
        <button
          onClick={onShowLevelSelect}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          Levels
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="bg-black border-2 border-cyan-700 cursor-crosshair"
      />
    </div>
  )
}