import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

const PROCESSED_FILE_WIDTH = 1200;
const PROCESSED_FILE_QUALITY = 80;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    // Parse the request
    const { token, fileId } = await request.json();
    
    if (!token || !fileId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the policy document
    const { data: policyDoc, error: docError } = await supabase
      .from('policy_documents')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', user.id)
      .single();
    
    if (docError || !policyDoc) {
      logger.error('Error finding policy document', { error: docError, fileId, userId: user.id });
      return NextResponse.json({ error: 'Policy document not found' }, { status: 404 });
    }
    
    // Verify the upload was completed by checking if we can access the file
    const { data: fileCheck, error: fileCheckError } = await supabase.storage
      .from('policy-documents-original')
      .createSignedUrl(policyDoc.original_path, 60);
    
    if (fileCheckError || !fileCheck) {
      logger.error('Error verifying upload existence', { error: fileCheckError, fileId, userId: user.id });
      return NextResponse.json({ error: 'Failed to verify upload' }, { status: 400 });
    }
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('policy-documents-original')
      .download(policyDoc.original_path);
    
    if (downloadError || !fileData) {
      logger.error('Error downloading original file', { error: downloadError, fileId, userId: user.id });
      return NextResponse.json({ error: 'Failed to download original file' }, { status: 500 });
    }
    
    // Calculate hash of original file
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalHash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Process file if it's an image
    let processedBuffer;
    if (policyDoc.file_type.startsWith('image/')) {
      logger.info('Processing image file with sharp', { fileId, userId: user.id });
      processedBuffer = await sharp(buffer)
        .rotate()
        .resize(PROCESSED_FILE_WIDTH, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: PROCESSED_FILE_QUALITY })
        .toBuffer();
    } else {
      // For non-image files (like PDFs), use the original buffer
      processedBuffer = buffer;
    }
    
    // Calculate hash of processed file
    const processedHash = crypto.createHash('sha256').update(processedBuffer).digest('hex');
    
    // Upload processed file to public storage
    const { error: processedError } = await supabase.storage
      .from('policy-documents-processed')
      .upload(policyDoc.processed_path, processedBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: policyDoc.file_type
      });
      
    if (processedError) {
      logger.error('Error uploading processed file', { error: processedError, userId: user.id });
      return NextResponse.json({ error: 'Failed to upload processed file' }, { status: 500 });
    }
    
    // Get the public URL for the processed file
    const { data: { publicUrl } } = supabase.storage
      .from('policy-documents-processed')
      .getPublicUrl(policyDoc.processed_path);
    
    // Update policy document status
    const { error: updateError } = await supabase
      .from('policy_documents')
      .update({
        upload_status: 'completed',
        original_hash: originalHash,
        processed_hash: processedHash
      })
      .eq('id', policyDoc.id);
    
    if (updateError) {
      logger.error('Error updating policy document status', { error: updateError, userId: user.id });
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }
    
    logger.info('Policy document processing completed', { 
      userId: user.id, 
      fileId, 
      originalPath: policyDoc.original_path,
      processedPath: policyDoc.processed_path
    });
    
    return NextResponse.json({
      id: fileId,
      url: publicUrl,
      status: 'completed'
    });
  } catch (error) {
    logger.error('Error completing upload process', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process upload' },
      { status: 500 }
    );
  }
} 