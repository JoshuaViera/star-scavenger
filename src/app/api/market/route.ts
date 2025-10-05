// src/app/api/market/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('cron_secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: marketData, error } = await supabaseAdmin.from('market').select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const updates = marketData.map(item => {
    const changePercent = (Math.random() - 0.5) * 0.2; // Fluctuate by up to +/- 10%
    const newPrice = Math.max(5, Math.round(item.price * (1 + changePercent)));
    return supabaseAdmin.from('market').update({ price: newPrice, updated_at: new Date().toISOString() }).eq('id', item.id);
  });
  
  await Promise.all(updates);

  return NextResponse.json({ success: true, message: 'Market prices updated.' });
}