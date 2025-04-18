export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AuthErrorCodes = {
  SESSION_ERROR: 'SESSION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  PASSWORD_RESET_ERROR: 'PASSWORD_RESET_ERROR',
  SIGNUP_ERROR: 'SIGNUP_ERROR',
  SIGNIN_ERROR: 'SIGNIN_ERROR',
  REFRESH_TOKEN_ERROR: 'REFRESH_TOKEN_ERROR',
  RESET_PASSWORD_ERROR: 'RESET_PASSWORD_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type AuthErrorCode = typeof AuthErrorCodes[keyof typeof AuthErrorCodes]; 