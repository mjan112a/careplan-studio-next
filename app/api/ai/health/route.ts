import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase-server';
import { GeminiService } from '@/lib/ai/gemini';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // SSR Auth
    const supabase = createServerSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.info('AI Health: Unauthorized request', { path: req.nextUrl.pathname });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gemini Health Check
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-pro';
    if (!apiKey) {
      logger.error('AI Health: Missing GEMINI_API_KEY in environment');
      return NextResponse.json({
        gemini: {
          status: 'error',
          error: 'Missing GEMINI_API_KEY in environment',
        },
      }, { status: 500 });
    }

    const gemini = new GeminiService(apiKey, modelName);
    const testPrompt = '[HEALTHCHECK] ping';
    let geminiResult = null;
    let geminiError = null;
    let geminiRequest = {
      prompt: testPrompt,
      file: undefined,
      model: modelName,
    };
    try {
      logger.info('AI Health: Sending test request to Gemini', { prompt: testPrompt, model: modelName });
      geminiResult = await gemini.generateContent({ prompt: testPrompt });
      logger.info('AI Health: Received test response from Gemini', { response: JSON.stringify(geminiResult.response, null, 2), model: modelName });
    } catch (error) {
      geminiError = error instanceof Error ? error.message : String(error);
      logger.error('AI Health: Gemini test failed', {
        error: geminiError,
        stack: error instanceof Error ? error.stack : undefined,
        model: modelName,
      });
    }

    return NextResponse.json({
      gemini: {
        status: geminiResult ? 'ok' : 'error',
        request: geminiRequest,
        response: geminiResult ? geminiResult.response : null,
        error: geminiError,
      },
    });
  } catch (error) {
    logger.error('AI Health: Error handling health check', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: req.nextUrl.pathname,
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 