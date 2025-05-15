import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

// This API route generates a direct upload URL for Supabase Storage
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Authenticate the user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Parse the request data
    const data = await request.json();
    const { fileName, fileType, fileSize, clientId } = data;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        error: `File type ${fileType} not allowed. Supported types: PDF, JPEG, PNG, WEBP` 
      }, { status: 400 });
    }

    // Generate unique ID and paths
    const fileId = uuidv4();
    const fileExt = fileName.split('.').pop();
    const originalPath = `${user.id}/${fileId}-original.${fileExt}`;
    const processedExt = fileType.startsWith('image/') ? 'jpg' : fileExt;
    const processedPath = `${user.id}/${fileId}.${processedExt}`;

    // Create a presigned URL for direct upload to the original bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('policy-documents-original')
      .createSignedUploadUrl(originalPath, {
        upsert: false
      });

    if (uploadError) {
      logger.error('Error creating signed URL', { error: uploadError, userId: user.id });
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Create policy_documents placeholder record
    const { error: documentError } = await supabase
      .from('policy_documents')
      .insert({
        client_id: clientId || null,
        user_id: user.id,
        file_id: fileId,
        original_path: originalPath,
        processed_path: processedPath,
        file_type: fileType,
        original_name: fileName,
        upload_status: 'pending'
      });

    if (documentError) {
      logger.error('Error creating policy_documents record', { error: documentError, userId: user.id });
      return NextResponse.json({ error: documentError.message }, { status: 500 });
    }

    logger.info('Generated direct upload URL for policy document', { 
      userId: user.id, 
      fileId, 
      clientId: clientId || null,
      fileName
    });

    // Return the signed URL and document ID
    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      token: uploadData.token,
      fileId,
      originalPath,
      processedPath
    });
  } catch (error) {
    logger.error('Error handling direct upload request', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 