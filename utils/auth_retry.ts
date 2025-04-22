import { AuthError, AuthErrorCodes } from '@/types/auth-errors';
import { logger } from '@/lib/logging';

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('Attempting operation', { attempt, maxRetries });
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn('Operation attempt failed', { 
        attempt, 
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof AuthError ? error.code : 'unknown'
      });
      
      // Don't retry if it's an auth error that shouldn't be retried
      if (error instanceof AuthError && 
          [AuthErrorCodes.INVALID_CREDENTIALS, 
           AuthErrorCodes.EMAIL_NOT_CONFIRMED,
           AuthErrorCodes.SIGNIN_ERROR].includes(error.code as any)) {
        logger.info('Not retrying auth error', { errorCode: error.code });
        throw error;
      }
      
      // If it's the last attempt and we have a specific error, throw that instead of a generic network error
      if (attempt === maxRetries && error instanceof AuthError) {
        logger.error('Max retries reached with auth error', { error });
        throw error;
      }
      
      if (attempt < maxRetries) {
        const backoffDelay = delay * attempt;
        logger.info('Retrying after delay', { attempt, backoffDelay });
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // Only throw network error if we don't have a more specific error
  logger.error('All retry attempts failed', { 
    maxRetries,
    lastError: lastError instanceof Error ? lastError.message : String(lastError)
  });
  throw new AuthError(
    'Operation failed after multiple retries',
    AuthErrorCodes.NETWORK_ERROR,
    lastError
  );
}; 