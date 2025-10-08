// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { gameState } from '@/lib/game-state'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      
      // Migrate local data when user logs in
      if (user) {
        gameState.migrateLocalDataToSupabase()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      // Migrate on login
      if (session?.user) {
        await gameState.migrateLocalDataToSupabase()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user, loading }
}