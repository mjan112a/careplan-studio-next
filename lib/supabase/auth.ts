import { User, Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import { Database } from '@/types/supabase';
import { getAppURL } from '@/utils/url';
import { supabase } from '@/utils/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Tables = Database['public']['Tables'];

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  /**
   * Get the current session
   */
  static async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Failed to get session', { error });
        throw new AuthError('Failed to get session', 'SESSION_ERROR', error);
      }
      
      return session;
    } catch (error) {
      logger.error('Error in getSession', { error });
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
      logger.error('Error in getUser', { error });
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
      logger.error('Error in isAuthenticated', { error });
      return false;
    }
  }

  /**
   * Check if the current user is an admin
   */
  static async isAdmin(): Promise<boolean> {
    logger.warn('isAdmin is not implemented');
    return false;
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
        logger.error('Failed to sign in', { error });
        throw new AuthError(
          error.message.includes('Invalid login credentials')
            ? 'Invalid email or password'
            : 'Failed to sign in',
          'SIGNIN_ERROR',
          error
        );
      }

      if (!session) {
        throw new AuthError('No session after sign in', 'SESSION_ERROR');
      }

      return session;
    } catch (error) {
      logger.error('Error in signInWithPassword', { error });
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
        logger.error('Failed to sign up', { error });
        throw new AuthError('Failed to sign up', 'SIGNUP_ERROR', error);
      }
    } catch (error) {
      logger.error('Error in signUp', { error });
      throw error;
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Failed to sign out', { error });
        throw new AuthError('Failed to sign out', 'SIGNOUT_ERROR', error);
      }
    } catch (error) {
      logger.error('Error in signOut', { error });
      throw error;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      const appUrl = getAppURL();
      logger.debug('Reset password using URL', { appUrl });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/update-password`,
      });

      if (error) {
        logger.error('Failed to reset password', { error });
        throw new AuthError('Failed to reset password', 'RESET_PASSWORD_ERROR', error);
      }
    } catch (error) {
      logger.error('Error in resetPassword', { error });
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