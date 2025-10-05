// src/components/AuthForm.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'

export default function AuthForm() {
  const supabase = createClient()
  const [redirectUrl, setRedirectUrl] = useState('')

  useEffect(() => {
    setRedirectUrl(`${window.location.origin}/auth/callback`)
  }, [])

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ 
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#06b6d4',
              brandAccent: '#0891b2',
            }
          }
        }
      }}
      theme="dark"
      providers={[]}
      redirectTo={redirectUrl}
    />
  )
}