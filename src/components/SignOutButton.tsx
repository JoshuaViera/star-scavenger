// src/components/SignOutButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="absolute top-4 right-4 px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors z-10"
    >
      Sign Out
    </button>
  )
}