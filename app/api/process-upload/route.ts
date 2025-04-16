import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const PROCESSED_FILE_WIDTH = 1200;
const PROCESSED_FILE_QUALITY = 80;

export async function POST(request: NextRequest) {
  // Get the JWT token from the Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  
  // Create a Supabase client with the JWT token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  try {
    // Set the JWT token and get user in one step
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError); // Debug log
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', user.id); // Debug log

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const planId = formData.get('planId') as string | null;
    
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

    let currentPlanId = planId;

    // Only create a new plan if planId is provided but invalid
    if (currentPlanId) {
      // Verify the plan exists and belongs to the user
      const { data: existingPlan, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('id', currentPlanId)
        .eq('userId', user.id)
        .single();

      if (planError || !existingPlan) {
        console.error('Error verifying plan:', planError);
        throw new Error('Invalid plan ID or plan does not belong to user');
      }
    }

    // Upload original to private storage
    const { error: originalError } = await supabase.storage
      .from('policy-documents-original')
      .upload(originalFileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          planId: currentPlanId || null,
          originalName: file.name,
          fileType: file.type,
          userId: user.id,
          fileHash: originalHash
        }
      });

    if (originalError) {
      console.error('Error uploading original:', originalError);
      throw originalError;
    }

    // Upload processed file to public storage
    const { error: processedError } = await supabase.storage
      .from('policy-documents-processed')
      .upload(processedFileName, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          planId: currentPlanId || null,
          originalName: file.name,
          fileType: file.type,
          userId: user.id,
          fileHash: processedHash
        }
      });

    if (processedError) {
      console.error('Error uploading processed:', processedError);
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
        plan_id: currentPlanId || null,
        user_id: user.id,
        file_id: fileId,
        original_path: originalFileName,
        processed_path: processedFileName,
        file_type: file.type,
        original_name: file.name
      });

    if (documentError) {
      console.error('Error creating policy_documents record:', documentError);
      throw documentError;
    }

    return NextResponse.json({
      id: fileId,
      url: publicUrl,
      originalFileName,
      processedFileName,
      planId: currentPlanId || null
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
} 