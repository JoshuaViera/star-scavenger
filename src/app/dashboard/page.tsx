// src/app/dashboard/page.tsx
import GameCanvas from '@/components/GameCanvas';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <h1 className="text-4xl font-bold text-white mb-4">Star Scavenger</h1>
        <GameCanvas />
    </div>
  );
}