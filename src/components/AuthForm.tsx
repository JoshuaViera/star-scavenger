// src/components/AuthForm.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';

export default function AuthForm() {
  const supabase = createClient();
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // This is needed to construct the redirect URL correctly on the client side
    setOrigin(window.location.origin);
  }, []);

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa,
        variables: {
            default: {
                colors: {
                    brand: 'cyan',
                    brandAccent: '#0891b2',
                    defaultButtonBackgroundHover: '#2dd4bf',
                }
            }
        }
       }}
      theme="dark"
      showLinks={true}
      providers={['github']} // Add social providers here
      redirectTo={origin ? `${origin}/auth/callback` : undefined}
    />
  );
}