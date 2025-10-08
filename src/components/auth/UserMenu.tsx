// src/components/auth/UserMenu.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserMenuProps {
  onLoginClick: () => void
}

export function UserMenu({ onLoginClick }: UserMenuProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowMenu(false)
  }

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Sign In
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        <span>{user.email?.split('@')[0]}</span>
        <span>▼</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 shadow-xl">
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full rounded px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}