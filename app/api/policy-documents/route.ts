import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List policy documents for a client or unassigned
// Or get a specific document by ID with metadata if id param is provided
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    
    const supabase = await createServerSupabaseClient();
    
    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    // If documentId is provided, get a specific document with metadata
    if (documentId) {
      logger.info('Fetching specific policy document with metadata', { documentId, userId: user.id });
      return await getDocumentWithMetadata(supabase, documentId);
    }
    
    // Otherwise, list documents (existing functionality)
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

// POST: Bulk fetch policy documents by ID list
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    // Parse request body
    const { documentIds } = await req.json();
    
    logger.info('Bulk fetching policy documents', { 
      documentIds, 
      count: documentIds?.length || 0,
      userId: user.id 
    });
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid document IDs provided' },
        { status: 400 }
      );
    }
    
    // Query the policy_documents table to get the documents with these IDs
    // Only return documents that belong to the authenticated user
    const { data: documents, error } = await supabase
      .from('policy_documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', user.id);
    
    if (error) {
      logger.error('Error fetching policy documents', { 
        error: error.message,
        documentIds,
        userId: user.id
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch policy documents' },
        { status: 500 }
      );
    }
    
    // Make sure processed_data is properly handled for each document
    const processedDocuments = documents.map(doc => {
      // Create a shallow copy of the document
      const processedDoc = {...doc};
      
      // If processed_data exists, make sure it's properly formatted
      if (processedDoc.processed_data) {
        try {
          // If it's a string, try to parse it as JSON
          if (typeof processedDoc.processed_data === 'string') {
            processedDoc.processed_data = JSON.parse(processedDoc.processed_data);
          }
          
          // Check if annual_policy_data exists and is accessible
          if (!processedDoc.processed_data.candidates) {
            logger.warn('Document missing annual_policy_data (no candidates)', { docId: doc.id });
          }
        } catch (parseError) {
          logger.error('Error processing document data', {
            docId: doc.id,
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
        }
      }
      
      return processedDoc;
    });
    
    logger.info('Successfully fetched policy documents in bulk', { 
      count: documents.length,
      requestedCount: documentIds.length,
      userId: user.id,
      dataPresent: processedDocuments.map(doc => !!doc.processed_data),
      documentStructures: processedDocuments.map(doc => ({
        id: doc.id,
        hasProcessedData: !!doc.processed_data,
        processedDataType: doc.processed_data ? typeof doc.processed_data : 'null',
        // Include the keys if it's an object to help debugging
        processedDataKeys: doc.processed_data && typeof doc.processed_data === 'object' 
          ? Object.keys(doc.processed_data) 
          : [],
        hasAnnualPolicyData: doc.processed_data && 
          typeof doc.processed_data === 'object' 
      }))
    });
    
    return NextResponse.json({ documents: processedDocuments });
  } catch (error) {
    logger.error('Error in policy-documents POST API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get a document with its metadata
async function getDocumentWithMetadata(supabase: any, documentId: string) {
  // Fetch the document
  const { data: policy, error } = await supabase
    .from('policy_documents')
    .select('*')
    .eq('id', documentId)
    .single();
  
  if (error || !policy) {
    logger.error('Policy document not found or fetch error', { id: documentId, error });
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  
  let originalUrl = null;
  let processedUrl = null;
  let originalMetadata = null;
  let processedMetadata = null;
  
  // Get original document URL and metadata
  if (policy.original_path) {
    // Get a signed URL for the original document
    const { data: originalData, error: originalError } = await supabase
      .storage
      .from('policy-documents-original')
      .createSignedUrl(policy.original_path, 60 * 60); // 1 hour expiry
    
    if (!originalError) {
      originalUrl = originalData?.signedUrl || null;
    }
    
    // Get metadata for original document
    logger.info('Fetching metadata for original document', { 
      bucket: 'policy-documents-original',
      path: policy.original_path 
    });
    
    const { data: originalMeta, error: originalMetadataError } = await supabase
      .rpc('get_storage_object_metadata_by_bucket', { 
        file_path: policy.original_path,
        bucket_name: 'policy-documents-original'
      });
      
    if (!originalMetadataError && originalMeta) {
      logger.info('Retrieved original document metadata', { 
        bucket: 'policy-documents-original',
        metadata: originalMeta 
      });
      originalMetadata = originalMeta;
    }
  }
  
  // Get processed document URL and metadata
  if (policy.processed_path) {
    // Get a public URL for the processed document
    processedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/policy-documents-processed/${policy.processed_path}`;
    
    // Get metadata for processed document
    logger.info('Fetching metadata for processed document', { 
      bucket: 'policy-documents-processed',
      path: policy.processed_path 
    });
    
    const { data: processedMeta, error: processedMetadataError } = await supabase
      .rpc('get_storage_object_metadata_by_bucket', { 
        file_path: policy.processed_path,
        bucket_name: 'policy-documents-processed'
      });
      
    if (!processedMetadataError && processedMeta) {
      logger.info('Retrieved processed document metadata', { 
        bucket: 'policy-documents-processed',
        metadata: processedMeta 
      });
      processedMetadata = processedMeta;
    }
  }
  
  // Return the document with URLs and metadata
  return NextResponse.json({
    document: policy,
    originalUrl,
    processedUrl,
    originalMetadata,
    processedMetadata
  });
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