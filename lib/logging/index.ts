/**
 * Logger entry point that exports the appropriate logger based on environment.
 * This maintains backward compatibility while allowing environment-specific logging.
 */

import { logger as serverLogger } from './server';
import { logger as clientLogger } from './client';
import { ILogger } from './types';

// Export the appropriate logger based on environment
export const logger: ILogger = 
  typeof window === 'undefined' ? serverLogger : clientLogger;

// Re-export types for convenience
export * from './types'; 