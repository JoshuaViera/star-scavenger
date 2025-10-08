// src/components/auth/AuthModal.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const supabase = createClient()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-md rounded-lg bg-gray-900 p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          Star Scavenger
        </h2>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#2563eb',
                }
              }
            }
          }}
          providers={['google', 'github']}
          redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
          onlyThirdPartyProviders={false}
        />
      </div>
    </div>
  )
}