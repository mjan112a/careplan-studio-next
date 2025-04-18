import { AuthError, AuthErrorCodes } from '@/types/auth-errors';

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's an auth error that shouldn't be retried
      if (error instanceof AuthError && 
          [AuthErrorCodes.INVALID_CREDENTIALS, AuthErrorCodes.EMAIL_NOT_CONFIRMED].includes(error.code)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw new AuthError(
    'Operation failed after multiple retries',
    AuthErrorCodes.NETWORK_ERROR,
    lastError
  );
}; 