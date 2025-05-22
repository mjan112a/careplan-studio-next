import { GoogleGenerativeAI, type GenerateContentRequest, type GenerateContentResult } from '@google/generative-ai';
import { logger } from '@/lib/logging';
import { logAIInteraction } from '@/lib/ai/ai-interactions';

export interface IAIService {
  generateContent(options: {
    prompt: string;
    file?: { buffer: Buffer; filename: string; mimetype: string };
    userId?: string;
    ipAddress?: string;
  }): Promise<unknown>;
}

export class GeminiService implements IAIService {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateContent({ prompt, file, userId, ipAddress }: { prompt: string; file?: { buffer: Buffer; filename: string; mimetype: string }; userId?: string; ipAddress?: string }): Promise<GenerateContentResult> {
    const start = process.hrtime.bigint();
    let status = 'success';
    let errorCode: string | null = null;
    let errorMessage: string | null = null;
    let response: GenerateContentResult | null = null;
    const request: GenerateContentRequest = {
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
    };
    let fileMetadata: { filename: string; mimetype: string; size?: number } | null = null;
    if (file) {
      fileMetadata = { filename: file.filename, mimetype: file.mimetype, size: file.buffer.length };
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        request.contents[0].parts.push({ inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } });
      }
    }
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      response = await model.generateContent(request);
      return response;
    } catch (error) {
      status = 'error';
      errorCode = (error as any)?.code || null;
      errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('GeminiService: Error generating content', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        context: { prompt, file: fileMetadata, model: this.modelName },
      });
      throw error;
    } finally {
      const end = process.hrtime.bigint();
      const latencyMs = Math.round(Number(end - start) / 1_000_000);
      await logAIInteraction({
        request: {
          prompt,
          file: fileMetadata,
          model: this.modelName,
        },
        response: response ? response.response : null,
        latencyMs,
        errorCode,
        errorMessage,
        modelName: this.modelName,
        userId,
        fileMetadata,
        status,
        promptHash: null, // Optionally hash the prompt for analytics
        ipAddress,
      });
    }
  }
} 