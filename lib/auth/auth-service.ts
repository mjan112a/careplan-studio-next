import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import { Database } from '@/types/supabase';
import { getAppURL } from '@/utils/url';
import { supabase } from '@/utils/supabase';
import { AuthError, AuthErrorCodes } from './auth-errors';
import { AUTH_ROUTES } from './constants';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Authentication Service
 * Handles all authentication-related operations using Supabase
 */
export class AuthService {
  /**
   * Get the current session
   */
  static async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Failed to get session', { 
          error: error.message,
          stack: error.stack
        });
        throw new AuthError('Failed to get session', AuthErrorCodes.SESSION_ERROR, error);
      }
      
      return session;
    } catch (error) {
      logger.error('Error in getSession', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get the current user
   */
  static async getUser(): Promise<User | null> {
    try {
      const session = await this.getSession();
      return session?.user ?? null;
    } catch (error) {
      logger.error('Error in getUser', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check if the current user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return !!session;
    } catch (error) {
      logger.error('Error in isAuthenticated', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Sign in with email and password
   */
  static async signInWithPassword(email: string, password: string): Promise<Session> {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Failed to sign in', { 
          error: error.message,
          email 
        });
        throw new AuthError(
          error.message.includes('Invalid login credentials')
            ? 'Invalid email or password'
            : 'Failed to sign in',
          AuthErrorCodes.SIGNIN_ERROR,
          error
        );
      }

      if (!session) {
        throw new AuthError('No session after sign in', AuthErrorCodes.SESSION_ERROR);
      }

      return session;
    } catch (error) {
      logger.error('Error in signInWithPassword', { 
        error: error instanceof Error ? error.message : String(error),
        email
      });
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, options?: { 
    data?: { full_name?: string } 
  }): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        logger.error('Failed to sign up', { 
          error: error.message,
          email 
        });
        throw new AuthError('Failed to sign up', AuthErrorCodes.SIGNUP_ERROR, error);
      }
    } catch (error) {
      logger.error('Error in signUp', { 
        error: error instanceof Error ? error.message : String(error),
        email
      });
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Failed to sign out', { error: error.message });
        throw new AuthError('Failed to sign out', AuthErrorCodes.SIGNOUT_ERROR, error);
      }
    } catch (error) {
      logger.error('Error in signOut', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      const appUrl = getAppURL();
      logger.debug('Reset password using URL', { appUrl });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}${AUTH_ROUTES.UPDATE_PASSWORD}`,
      });

      if (error) {
        logger.error('Failed to reset password', { 
          error: error.message,
          email 
        });
        throw new AuthError('Failed to reset password', AuthErrorCodes.RESET_PASSWORD_ERROR, error);
      }
    } catch (error) {
      logger.error('Error in resetPassword', { 
        error: error instanceof Error ? error.message : String(error),
        email
      });
      throw error;
    }
  }

  /**
   * Update user's password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        logger.error('Failed to update password', { error: error.message });
        throw new AuthError('Failed to update password', AuthErrorCodes.RESET_PASSWORD_ERROR, error);
      }
    } catch (error) {
      logger.error('Error in updatePassword', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Initialize auth state change listener
   */
  static initializeAuthListener(callback: (event: string, session: Session | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }
} 