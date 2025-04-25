import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';
import { AuthError, AuthErrorCodes } from '@/types/auth-errors';
import { logger } from '@/lib/logging';

// Simple function to get session without caching
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
    logger.error('getSession', { error });
    throw error;
  }
};

// Get user from session
export const getUser = async (): Promise<User | null> => {
  const session = await getSession();
  return session?.user || null;
};

// Simple function to recover from auth errors
export const recoverFromAuthError = async () => {
  try {
    // Try to refresh the session
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
    logger.error('recoverFromAuthError', { error });
    throw error;
  }
};

// Initialize auth listener
export const initializeAuthListener = (callback?: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (callback) {
      callback(event, session);
    }
  });
  
  return () => {
    subscription.unsubscribe();
  };
}; 