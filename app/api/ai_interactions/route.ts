import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { type Database } from '@/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error('ai_interactions GET: No user found in authenticated session', { error: userError?.message });
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    let query = supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (start) query = query.gte('timestamp', start);
    if (end) query = query.lte('timestamp', end);

    const { data, error } = await query;
    if (error) {
      logger.error('ai_interactions GET: DB error', { error: error.message });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('ai_interactions GET: Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 