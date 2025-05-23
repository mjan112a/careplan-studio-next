'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { logger } from '@/lib/logging';
import { 
  AuthService, 
  withRetry, 
  AuthError, 
  AuthErrorCodes,
  AuthMode,
  AUTH_ROUTES,
  ERROR_MESSAGES
} from '@/lib/auth';

interface AuthFormProps {
  mode: AuthMode;
}

// Create a separate component that uses useSearchParams
function AuthFormWithParams({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom');

  // Check for error parameters in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      logger.info('Error parameters detected in URL', { 
        errorParam,
        errorCode,
        errorDescription 
      });
      
      // Display a user-friendly error message
      if (errorCode === 'otp_expired') {
        setError(ERROR_MESSAGES.PASSWORD_RESET_EXPIRED);
      } else if (errorDescription) {
        try {
          const decodedError = decodeURIComponent(errorDescription);
          setError(decodedError);
        } catch (e) {
          setError(errorDescription.replace(/\+/g, ' '));
        }
      } else {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      }
    }
  }, [searchParams]);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await AuthService.getSession();
        setCurrentSession(session);
        
        // Debug log the initial session state
        logger.debug('Auth check - Initial session state', {
          mode,
          hasSession: !!session,
          userId: session?.user?.id,
          recovery_sent_at: session?.user?.recovery_sent_at
        });

        // If trying to access update-password without a session, redirect to reset-password
        if (mode === 'update-password' && !session) {
          logger.info('Unauthorized access to update-password page, redirecting to reset-password');
          router.push(AUTH_ROUTES.RESET_PASSWORD);
          return;
        }

        // Only check recovery validation for update-password mode
        if (mode === 'update-password') {
          // Check if this is a password reset flow and checking if supabase is providing a recovery key
          const recoveryTimestamp = session?.user?.recovery_sent_at ? new Date(session.user.recovery_sent_at).getTime() : 0;
          const now = Date.now();
          const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
          
          const hasRecentRecovery = recoveryTimestamp > 0 && (now - recoveryTimestamp) < ONE_HOUR;
          
          const isPasswordReset = hasRecentRecovery;

          // Debug log the recovery check details
          logger.debug('Auth check - Recovery validation', {
            recoveryTimestamp,
            now,
            timeSinceRecovery: recoveryTimestamp > 0 ? (now - recoveryTimestamp) / 1000 / 60 : 'no recovery',
            hasRecentRecovery,
            isPasswordReset
          });

          if (session && !isPasswordReset) {
            logger.info('User already authenticated but no valid recovery token, redirecting', { 
              userId: session.user.id,
              redirectedFrom: redirectedFrom || '/dashboard',
              recoveryAge: recoveryTimestamp > 0 ? `${((now - recoveryTimestamp) / 1000 / 60).toFixed(1)} minutes` : 'no recovery'
            });
            router.push(redirectedFrom || '/dashboard');
          }
        } else if (session) {
          // For non-update-password modes, just redirect if authenticated
          logger.info('User already authenticated, redirecting', {
            userId: session.user.id,
            redirectedFrom: redirectedFrom || '/dashboard'
          });
          router.push(redirectedFrom || '/dashboard');
        }
      } catch (error) {
        logger.error('Error checking auth state', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };

    checkAuth();
  }, [mode, redirectedFrom, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      logger.info('Starting auth operation', { mode });

      if (mode === 'sign-up') {
        await withRetry(async () => {
          logger.info('Attempting signup', { email });
          await AuthService.signUp(email, password, {
            data: { full_name: fullName }
          });
          logger.info('Signup successful, verification email sent', { email });
        });
        setMessage('Check your email for the confirmation link.');
      } else if (mode === 'sign-in') {
        let signInSuccess = false;
        await withRetry(async () => {
          logger.info('Attempting signin', { email });
          await AuthService.signInWithPassword(email, password);
          logger.info('Signin successful', { email });
          signInSuccess = true;
        });
        
        // Only redirect after successful sign in and outside the retry block
        if (signInSuccess) {
          try {
            logger.debug('Redirecting after successful sign in', {
              redirectTo: redirectedFrom || '/dashboard'
            });
            await router.replace(redirectedFrom || '/dashboard');
          } catch (navError) {
            logger.error('Navigation error after sign in', {
              error: navError instanceof Error ? navError.message : String(navError),
              redirectTo: redirectedFrom || '/dashboard'
            });
            // Don't throw here - sign in was successful, navigation error shouldn't fail the operation
          }
        }
      } else if (mode === 'reset-password') {
        await withRetry(async () => {
          logger.info('Attempting password reset', { email });
          await AuthService.resetPassword(email);
          logger.info('Password reset email sent', { email });
        });
        setMessage('Check your email for the password reset link.');
      } else if (mode === 'update-password') {
        let updateSuccess = false;
        await withRetry(async () => {
          logger.info('Updating password');
          await AuthService.updatePassword(password);
          logger.info('Password updated successfully');
          
          // Get fresh session after password update
          const session = await AuthService.getSession();
          if (!session) {
            throw new Error('Session not found after password update');
          }
          
          setMessage('Your password has been updated successfully. Redirecting...');
          updateSuccess = true;
        });

        if (updateSuccess) {
          // Small delay to show the success message
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          try {
            logger.debug('Redirecting after successful password update', {
              redirectTo: '/dashboard'
            });
            await router.replace('/dashboard');
          } catch (navError) {
            logger.error('Navigation error after password update', {
              error: navError instanceof Error ? navError.message : String(navError),
              redirectTo: '/dashboard'
            });
            // Don't throw here - password update was successful, navigation error shouldn't fail the operation
          }
        }
      }
    } catch (error) {
      logger.error('Auth operation failed', { 
        mode,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof AuthError ? error.code : 'unknown'
      });
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'sign-in' && 'Sign in to your account'}
            {mode === 'sign-up' && 'Create a new account'}
            {mode === 'reset-password' && 'Reset your password'}
            {mode === 'update-password' && 'Set your new password'}
          </h2>
          {mode === 'update-password' && !currentSession && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Please use the reset password link from your email to access this page
            </p>
          )}
          {mode === 'update-password' && currentSession && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {mode === 'sign-up' && (
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            {mode !== 'update-password' && (
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            {mode !== 'reset-password' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'update-password' ? 'new-password' : mode === 'sign-up' ? 'new-password' : 'current-password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={mode === 'update-password' ? 'New password' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          {message && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {mode === 'sign-in' && 'Sign in'}
              {mode === 'sign-up' && 'Sign up'}
              {mode === 'reset-password' && 'Send reset link'}
              {mode === 'update-password' && 'Update password'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          {mode === 'sign-in' && (
            <>
              <p className="text-sm text-gray-600">
                <Link href={AUTH_ROUTES.SIGN_UP} className="font-medium text-indigo-600 hover:text-indigo-500">
                  Don't have an account? Sign up
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link href={AUTH_ROUTES.RESET_PASSWORD} className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </p>
            </>
          )}
          {mode === 'sign-up' && (
            <p className="text-sm text-gray-600">
              <Link href={AUTH_ROUTES.SIGN_IN} className="font-medium text-indigo-600 hover:text-indigo-500">
                Already have an account? Sign in
              </Link>
            </p>
          )}
          {mode === 'reset-password' && (
            <p className="text-sm text-gray-600">
              <Link href={AUTH_ROUTES.SIGN_IN} className="font-medium text-indigo-600 hover:text-indigo-500">
                Remember your password? Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the inner component with Suspense
export default function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <AuthFormWithParams {...props} />
    </Suspense>
  );
} 