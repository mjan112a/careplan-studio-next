import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase-server';
import { GeminiService } from '@/lib/ai/gemini';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 60; // These functions can run for a maximum of 30 seconds

export async function POST(req: NextRequest) {
  try {
    // SSR Auth
    const supabase = createServerSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.info('Gemini API: Unauthorized request', { path: req.nextUrl.pathname });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request
    const contentType = req.headers.get('content-type') || '';
    let requestData;
    
    if (contentType.startsWith('multipart/form-data')) {
      // Handle legacy multipart form data (with file upload)
      const formData = await req.formData();
      const prompt = formData.get('prompt');
      const filePath = formData.get('filePath');
      const policyId = formData.get('policyId');
      
      requestData = {
        prompt: prompt as string,
        filePath: filePath as string,
        policyId: policyId as string
      };
    } else {
      // Handle JSON request
      requestData = await req.json();
    }
    
    const { prompt, filePath, policyId, fileType, fileName } = requestData;

    if (typeof prompt !== 'string' || !prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
    }

    // Retrieve the file from Supabase storage
    logger.info('Gemini API: Retrieving file from storage', { 
      filePath, 
      policyId,
      userId: user.id 
    });
    
    const { data: fileData, error: fileError } = await supabase.storage
      .from('policy-documents-processed')
      .download(filePath);
      
    if (fileError || !fileData) {
      logger.error('Gemini API: Failed to retrieve file from storage', {
        error: fileError,
        filePath,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 });
    }
    
    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileMetadata = {
      buffer,
      filename: fileName || filePath.split('/').pop() || 'document',
      mimetype: fileType || (filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    };

    logger.info('Gemini API: Received request', {
      prompt,
      file: { filename: fileMetadata.filename, mimetype: fileMetadata.mimetype, size: buffer.length },
      userId: user.id,
    });

    // Gemini Service
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'models/gemini-1.5-pro-latest';
    if (!apiKey) {
      logger.error('Gemini API: Missing GEMINI_API_KEY in environment');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }
    const gemini = new GeminiService(apiKey, modelName);
    const result = await gemini.generateContent({ 
      prompt, 
      file: fileMetadata, 
      userId: user.id 
    });

    logger.info('Gemini API: Responding with Gemini result', {
      response: JSON.stringify(result.response, null, 2),
      userId: user.id,
    });

    return NextResponse.json(result.response);
  } catch (error) {
    logger.error('Gemini API: Error handling request', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: req.nextUrl.pathname,
    });
    // Bubble up 504 if timeout detected
    const message = error instanceof Error ? error.message : String(error);
    if (message && (message.includes('timeout') || message.includes('504'))) {
      return NextResponse.json({ error: message }, { status: 504 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 