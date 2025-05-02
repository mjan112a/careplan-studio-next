import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

// GET: List policy documents for a client or unassigned
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    let query = supabase
      .from('policy_documents')
      .select('*')
      .eq('user_id', user.id);
    if (clientId === 'null' || clientId === null) {
      query = query.is('client_id', null);
    } else {
      query = query.eq('client_id', clientId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      logger.error('Error fetching policy documents', { error: error.message, userId: user.id, clientId });
      return NextResponse.json({ error: 'Failed to fetch policy documents' }, { status: 500 });
    }
    return NextResponse.json({ documents: data });
  } catch (error) {
    logger.error('Error in policy-documents GET API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a policy document by id (if owned by user)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    if (!documentId) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }
    // Fetch document to get storage paths
    const { data: doc, error: fetchError } = await supabase
      .from('policy_documents')
      .select('id, user_id, original_path, processed_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();
    if (fetchError || !doc) {
      logger.error('Policy document not found or not owned by user', { documentId, userId: user.id });
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    // Delete from storage
    const { error: origDel } = await supabase.storage.from('policy-documents-original').remove([doc.original_path]);
    const { error: procDel } = await supabase.storage.from('policy-documents-processed').remove([doc.processed_path]);
    if (origDel || procDel) {
      logger.error('Error deleting files from storage', { origDel, procDel, documentId });
    }
    // Delete from DB
    const { error: dbDel } = await supabase
      .from('policy_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);
    if (dbDel) {
      logger.error('Error deleting policy document from DB', { dbDel, documentId });
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
    logger.info('Policy document deleted', { documentId, userId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in policy-documents DELETE API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update processed_data or approved for a policy document
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const body = await req.json();
    const { id, processed_data, approved } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }
    // Build update object
    const update: Record<string, any> = {};
    if (processed_data !== undefined) update.processed_data = processed_data;
    if (approved !== undefined) update.approved = approved;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const { error } = await supabase
      .from('policy_documents')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      logger.error('Error updating policy document', { error: error.message, id, userId: user.id });
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
    logger.info('Policy document updated', { id, userId: user.id, update });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in policy-documents PATCH API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 