/**
 * Logger entry point that exports the appropriate logger based on environment.
 * This maintains backward compatibility while allowing environment-specific logging.
 */

import { logger as serverLogger } from './server';
import { logger as clientLogger } from './client';
import { ILogger, LogContext } from './types';

// Export the appropriate logger based on environment
export const logger: ILogger = 
  typeof window === 'undefined' ? serverLogger : clientLogger;

/**
 * Utility function to standardize error handling and logging.
 * 
 * @param error The error object to format
 * @param contextData Additional context data to include in the log
 * @returns A formatted error context object for structured logging
 */
export function formatErrorContext(error: unknown, contextData: Record<string, unknown> = {}): LogContext {
  const isErrorObject = error instanceof Error;
  
  return {
    ...contextData,
    error: isErrorObject ? error.message : String(error),
    stack: isErrorObject ? error.stack : undefined,
    errorType: isErrorObject ? error.constructor.name : typeof error,
    ...((error as any)?.cause ? { cause: (error as any).cause } : {})
  };
}

/**
 * Helper function to log errors with standardized format.
 * 
 * @param message The log message
 * @param error The error object
 * @param contextData Additional context data
 */
export function logError(message: string, error: unknown, contextData: Record<string, unknown> = {}): void {
  logger.error(message, formatErrorContext(error, contextData));
}

/**
 * Helper function to log debug messages with consistent format.
 * 
 * @param message The log message
 * @param contextData Additional context data
 */
export function logDebug(message: string, contextData: Record<string, unknown> = {}): void {
  logger.debug(message, contextData);
}

/**
 * Helper function to log informational messages with consistent format.
 * 
 * @param message The log message
 * @param contextData Additional context data
 */
export function logInfo(message: string, contextData: Record<string, unknown> = {}): void {
  logger.info(message, contextData);
}

/**
 * Helper function to log warning messages with consistent format.
 * 
 * @param message The log message
 * @param contextData Additional context data
 */
export function logWarn(message: string, contextData: Record<string, unknown> = {}): void {
  logger.warn(message, contextData);
}

// Re-export types for convenience
export * from './types'; 