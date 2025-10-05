// src/app/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// This page will have no visible content. It only handles redirection.
export default async function Home() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If the user is logged in, send them to the game dashboard.
  if (session) {
    redirect('/dashboard');
  } 
  // If the user is not logged in, send them to the login page.
  else {
    redirect('/login');
  }
}