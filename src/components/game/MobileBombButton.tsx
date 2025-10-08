// src/components/game/MobileBombButton.tsx
'use client'

interface MobileBombButtonProps {
  hasBomb: boolean
  onBomb: () => void
}

export function MobileBombButton({ hasBomb, onBomb }: MobileBombButtonProps) {
  if (!hasBomb) return null

  return (
    <button
      onClick={onBomb}
      className="fixed bottom-6 right-6 z-30 w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg flex items-center justify-center text-4xl active:scale-95 transition-transform"
      style={{
        touchAction: 'manipulation',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    >
      💣
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(168, 85, 247, 0);
          }
        }
      `}</style>
    </button>
  )
}