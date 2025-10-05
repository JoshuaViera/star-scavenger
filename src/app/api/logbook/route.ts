// src/app/api/logbook/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('cron_secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { runData, userId } = await request.json();

  if (!runData || !userId) {
    return NextResponse.json({ error: 'Missing run data or user ID' }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  const prompt = `You are a spaceship's log computer. Take this JSON data of a pilot's last run and write a cool, one-paragraph 'Captain's Log' entry summarizing the events in a gritty, sci-fi style. Data: ${JSON.stringify(runData)}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const logEntry = response.text();
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.from('logs').insert({ user_id: userId, log_entry: logEntry });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, logEntry });
}