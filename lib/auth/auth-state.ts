import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { AuthError, AuthErrorCodes } from './auth-errors';
import { logger } from '@/lib/logging';

/**
 * Get the current session without caching
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      // Check for refresh token errors
      if (error.message.includes('refresh_token_not_found')) {
        throw new AuthError(
          'Session expired',
          AuthErrorCodes.REFRESH_TOKEN_ERROR,
          error
        );
      }
      throw new AuthError(
        'Failed to get session',
        AuthErrorCodes.SESSION_ERROR,
        error
      );
    }
    
    return data.session;
  } catch (error) {
    logger.error('Error getting session', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Get user from session
 */
export const getUser = async (): Promise<User | null> => {
  const session = await getSession();
  return session?.user || null;
};

/**
 * Attempt to recover from auth errors by refreshing the session
 */
export const recoverFromAuthError = async () => {
  try {
    logger.info('Attempting to recover from auth error');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw new AuthError(
        'Failed to refresh session',
        AuthErrorCodes.SESSION_ERROR,
        error
      );
    }
    
    return data.session;
  } catch (error) {
    logger.error('Failed to recover from auth error', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Initialize auth state change listener
 */
export const initializeAuthListener = (callback?: (event: string, session: Session | null) => void) => {
  logger.debug('Initializing auth state listener');
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info('Auth state changed', { event, userId: session?.user?.id });
    if (callback) {
      callback(event, session);
    }
  });
  
  return () => {
    logger.debug('Cleaning up auth state listener');
    subscription.unsubscribe();
  };
}; 