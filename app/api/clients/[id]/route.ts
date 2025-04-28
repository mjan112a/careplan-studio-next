import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, description, status, user_id, created_at, updated_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    if (error || !client) {
      logger.error('Error fetching client', {
        error: error?.message,
        userId: user.id,
        clientId: params.id
      });
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    logger.error('Error in client GET API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const body = await req.json();
    const { name, description } = body;
    const { data: client, error } = await supabase
      .from('clients')
      .update({ name, description })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id, name, description, status, user_id, created_at, updated_at')
      .single();
    if (error || !client) {
      logger.error('Error updating client', {
        error: error?.message,
        userId: user.id,
        clientId: params.id
      });
      return NextResponse.json({ error: 'Failed to update client' }, { status: 404 });
    }
    logger.info('Client updated', { userId: user.id, clientId: client.id });
    return NextResponse.json(client);
  } catch (error) {
    logger.error('Error in client PUT API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const { data: client, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id, name, description, status, user_id, created_at, updated_at')
      .single();
    if (error || !client) {
      logger.error('Error deleting client', {
        error: error?.message,
        userId: user.id,
        clientId: params.id
      });
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 404 });
    }
    logger.info('Client deleted', { userId: user.id, clientId: client.id });
    return NextResponse.json(client);
  } catch (error) {
    logger.error('Error in client DELETE API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 