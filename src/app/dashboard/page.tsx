// src/app/dashboard/page.tsx
import GameCanvas from '@/components/GameCanvas'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900">
      <GameCanvas />
    </div>
  )
}