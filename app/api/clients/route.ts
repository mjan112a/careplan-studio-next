import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, description, status, user_id, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    logger.debug('Clients query results', {
      userId: user.id,
      clientCount: clients?.length || 0,
      hasError: !!clientsError,
      error: clientsError?.message
    });
    if (clientsError) {
      logger.error('Error fetching clients', {
        error: clientsError,
        userId: user.id,
        context: {
          message: clientsError.message,
          code: clientsError.code,
          details: clientsError.details
        }
      });
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
    return NextResponse.json({ clients });
  } catch (error) {
    logger.error('Error in clients API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const body = await req.json();
    const { name, description } = body;
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({ name, description, user_id: user.id, status: 'DRAFT' })
      .select('id, name, description, status, user_id, created_at, updated_at')
      .single();
    logger.info('Client created', { userId: user.id, clientId: client?.id });
    if (insertError) {
      logger.error('Error creating client', {
        error: insertError,
        userId: user.id,
        context: {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details
        }
      });
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
    return NextResponse.json(client);
  } catch (error) {
    logger.error('Error in clients API (POST)', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 