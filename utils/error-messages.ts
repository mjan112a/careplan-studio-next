import { AuthError, AuthErrorCodes } from '@/types/auth-errors';

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof AuthError) {
    switch (error.code) {
      case AuthErrorCodes.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please try again.';
      case AuthErrorCodes.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection.';
      case AuthErrorCodes.EMAIL_NOT_CONFIRMED:
        return 'Please check your email to confirm your account before signing in.';
      case AuthErrorCodes.PASSWORD_RESET_ERROR:
        return 'Unable to process password reset. Please try again.';
      case AuthErrorCodes.SIGNUP_ERROR:
        return 'Unable to create account. Please try again.';
      case AuthErrorCodes.SIGNIN_ERROR:
        return 'Unable to sign in. Please try again.';
      case AuthErrorCodes.SESSION_ERROR:
        return 'Session error. Please try signing in again.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
  return 'An unexpected error occurred. Please try again later.';
};

export const logAuthError = (error: unknown, context: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`Auth Error in ${context}:`, {
    message: errorMessage,
    stack: errorStack,
    originalError: error
  });
  
  // Here you could add error tracking service integration
  // e.g., Sentry, LogRocket, etc.
}; 