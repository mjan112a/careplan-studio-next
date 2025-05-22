import { createAdminClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import { type Database } from '@/types/supabase';

export interface LogAIInteractionParams {
  request: unknown;
  response?: unknown;
  latencyMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  modelName: string;
  userId?: string | null;
  fileMetadata?: unknown;
  status?: string;
  promptHash?: string | null;
  ipAddress?: string | null;
}

export async function logAIInteraction({
  request,
  response = null,
  latencyMs = null,
  errorCode = null,
  errorMessage = null,
  modelName,
  userId = null,
  fileMetadata = null,
  status = 'success',
  promptHash = null,
  ipAddress = null,
}: LogAIInteractionParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('ai_interactions').insert([
      {
        request,
        response,
        latency_ms: latencyMs,
        error_code: errorCode,
        error_message: errorMessage,
        model_name: modelName,
        user_id: userId,
        file_metadata: fileMetadata,
        status,
        prompt_hash: promptHash,
        ip_address: ipAddress,
      },
    ]);
    if (error) {
      logger.error('Failed to log AI interaction', {
        error: error.message,
        context: { modelName, userId, status, errorCode, errorMessage },
      });
    } else {
      logger.debug('Logged AI interaction', { modelName, userId, status });
    }
  } catch (error) {
    logger.error('Exception while logging AI interaction', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { modelName, userId, status, errorCode, errorMessage },
    });
  }
} 