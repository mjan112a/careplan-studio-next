import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

const PROCESSED_FILE_WIDTH = 1200;
const PROCESSED_FILE_QUALITY = 80;

export async function POST(request: NextRequest) {
  // Check if user is authenticated using getUser() for better security
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
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

    let currentPlanId = planId;

    // If no planId provided, create a new plan
    if (!currentPlanId) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert({
          title: 'DRAFT',
          description: 'DRAFT',
          status: 'DRAFT',
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select('id')
        .single();

      if (planError) {
        console.error('Error creating plan:', planError);
        throw planError;
      }

      currentPlanId = plan.id;
    }

    // Upload original to private storage
    const { error: originalError } = await supabase.storage
      .from('policy-documents-private')
      .upload(originalFileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          planId: currentPlanId,
          originalName: file.name,
          fileType: file.type
        }
      });

    if (originalError) {
      console.error('Error uploading original:', originalError);
      throw originalError;
    }

    // Upload processed file to public storage
    const { error: processedError } = await supabase.storage
      .from('policy-documents-public')
      .upload(processedFileName, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          planId: currentPlanId,
          originalName: file.name,
          fileType: file.type
        }
      });

    if (processedError) {
      console.error('Error uploading processed:', processedError);
      throw processedError;
    }

    // Get the public URL for the processed file
    const { data: { publicUrl } } = supabase.storage
      .from('policy-documents-public')
      .getPublicUrl(processedFileName);

    // Get the current count of documents for this plan
    const { count } = await supabase
      .from('policy_documents')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', currentPlanId);

    // Create policy_documents record
    const { error: documentError } = await supabase
      .from('policy_documents')
      .insert({
        plan_id: currentPlanId,
        user_id: user.id,
        file_id: fileId,
        original_path: originalFileName,
        processed_path: processedFileName,
        is_featured: count === 0, // First document is featured by default
        display_order: (count || 0) + 1,
        public_url: publicUrl,
        file_type: file.type,
        original_name: file.name
      });

    if (documentError) {
      console.error('Error creating policy_documents record:', documentError);
      throw documentError;
    }

    // If this is the first document, update the plan's featuredDocumentUrl
    if (count === 0) {
      const { error: updateError } = await supabase
        .from('plans')
        .update({ featuredDocumentUrl: publicUrl })
        .eq('id', currentPlanId);

      if (updateError) {
        console.error('Error updating plan featured document:', updateError);
        throw updateError;
      }
    }

    return NextResponse.json({
      id: fileId,
      url: publicUrl,
      originalFileName,
      processedFileName,
      planId: currentPlanId
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
} 