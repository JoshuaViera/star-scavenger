// src/app/dashboard/page.tsx
import GameCanvas from '@/components/GameCanvas'
import SignOutButton from '@/components/SignOutButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <SignOutButton />
      <h1 className="text-4xl font-bold text-white mb-8">Star Scavenger</h1>
      <GameCanvas />
    </div>
  )
}