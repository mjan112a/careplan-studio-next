/**
 * Authentication Constants
 */

// Retry Configuration
export const AUTH_RETRY = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // ms
} as const;

// Session Management
export const SESSION = {
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// Routes
export const AUTH_ROUTES = {
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/auth/sign-up',
  RESET_PASSWORD: '/auth/reset-password',
  UPDATE_PASSWORD: '/auth/update-password',
  DEFAULT_REDIRECT: '/dashboard',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  NETWORK_ERROR: 'Unable to connect to the authentication service. Please try again.',
  PASSWORD_RESET_EXPIRED: 'Your password reset link has expired. Please request a new one.',
} as const; 