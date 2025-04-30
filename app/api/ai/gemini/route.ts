import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase-server';
import { GeminiService } from '@/lib/ai/gemini';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

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

    // Parse multipart form
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }
    const formData = await req.formData();
    const prompt = formData.get('prompt');
    const file = formData.get('file') as File | null;

    if (typeof prompt !== 'string' || !prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    let fileData: { buffer: Buffer; filename: string; mimetype: string } | undefined = undefined;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      fileData = {
        buffer: Buffer.from(arrayBuffer),
        filename: file.name,
        mimetype: file.type,
      };
    }

    logger.info('Gemini API: Received request', {
      prompt,
      file: fileData ? { filename: fileData.filename, mimetype: fileData.mimetype } : undefined,
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
    const result = await gemini.generateContent({ prompt, file: fileData });

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
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 