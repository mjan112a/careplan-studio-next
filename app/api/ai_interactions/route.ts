import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { type Database } from '@/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    // SSR Auth: get user session
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      logger.error('ai_interactions GET: Auth session error', { error: sessionError.message });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const authedUserId = session?.user?.id;
    const authedUserRole = session?.user?.role || 'user';

    // Only allow access to own records unless admin
    if (userId && userId !== authedUserId && authedUserRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const queryUserId = userId || authedUserId;

    let query = supabase
      .from('ai_interactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (queryUserId) query = query.eq('user_id', queryUserId);
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