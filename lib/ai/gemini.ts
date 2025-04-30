import { GoogleGenerativeAI, type GenerateContentRequest, type GenerateContentResult } from '@google/generative-ai';
import { logger } from '@/lib/logging';

export interface IAIService {
  generateContent(options: {
    prompt: string;
    file?: { buffer: Buffer; filename: string; mimetype: string };
  }): Promise<unknown>;
}

export class GeminiService implements IAIService {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateContent({ prompt, file }: { prompt: string; file?: { buffer: Buffer; filename: string; mimetype: string } }): Promise<GenerateContentResult> {
    try {
      const request: GenerateContentRequest = {
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
        ],
      };

      if (file) {
        // For logging, only log filename and mimetype
        logger.info('GeminiService: Received file for prompt', { filename: file.filename, mimetype: file.mimetype });
        // Add file as part if supported (Gemini supports images, not PDFs directly)
        if (file.mimetype.startsWith('image/')) {
          request.contents[0].parts.push({ inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } });
        } else {
          logger.info('GeminiService: File type not supported for inline data', { filename: file.filename, mimetype: file.mimetype });
        }
      }

      logger.info('GeminiService: Sending request to Gemini', {
        prompt,
        file: file ? { filename: file.filename, mimetype: file.mimetype } : undefined,
        model: this.modelName,
      });

      const model = this.client.getGenerativeModel({ model: this.modelName });
      const response: GenerateContentResult = await model.generateContent(request);

      logger.info('GeminiService: Received response from Gemini', {
        response: JSON.stringify(response.response, null, 2),
        model: this.modelName,
      });

      return response;
    } catch (error) {
      logger.error('GeminiService: Error generating content', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: { prompt, file: file ? { filename: file.filename, mimetype: file.mimetype } : undefined, model: this.modelName },
      });
      throw error;
    }
  }
} 