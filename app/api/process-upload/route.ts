import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
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
    logger.info('Authenticated user for policy upload', { userId: user.id });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string | null;
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const originalFileName = `${user.id}/${fileId}-original.${fileExt}`;
    const processedFileName = `${user.id}/${fileId}.jpg`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate hash of original file
    const originalHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Process file if it's an image
    let processedBuffer;
    if (file.type.startsWith('image/')) {
      processedBuffer = await sharp(buffer)
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

    // Upload original to private storage
    const { error: originalError } = await supabase.storage
      .from('policy-documents-original')
      .upload(originalFileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          clientId: clientId || null,
          originalName: file.name,
          fileType: file.type,
          userId: user.id,
          fileHash: originalHash
        }
      });
    if (originalError) {
      logger.error('Error uploading original', { error: originalError, userId: user.id });
      throw originalError;
    }

    // Upload processed file to public storage
    const { error: processedError } = await supabase.storage
      .from('policy-documents-processed')
      .upload(processedFileName, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          clientId: clientId || null,
          originalName: file.name,
          fileType: file.type,
          userId: user.id,
          fileHash: processedHash
        }
      });
    if (processedError) {
      logger.error('Error uploading processed', { error: processedError, userId: user.id });
      throw processedError;
    }

    // Get the public URL for the processed file
    const { data: { publicUrl } } = supabase.storage
      .from('policy-documents-processed')
      .getPublicUrl(processedFileName);

    // Create policy_documents record
    const { error: documentError } = await supabase
      .from('policy_documents')
      .insert({
        client_id: clientId || null,
        user_id: user.id,
        file_id: fileId,
        original_path: originalFileName,
        processed_path: processedFileName,
        file_type: file.type,
        original_name: file.name
      });
    if (documentError) {
      logger.error('Error creating policy_documents record', { error: documentError, userId: user.id });
      throw documentError;
    }

    logger.info('Policy document uploaded', { userId: user.id, fileId, clientId });
    return NextResponse.json({
      id: fileId,
      url: publicUrl,
      originalFileName,
      processedFileName,
      clientId: clientId || null
    });
  } catch (error) {
    logger.error('Error processing file', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
} 