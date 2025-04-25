import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { initializeAuthListener, getSession } from '@/utils/auth-state';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AuthError, AuthErrorCodes } from '@/types/auth-errors';
import { logger } from '@/lib/logging';
import { withRetry } from '@/utils/auth_retry';
import { getAppURL, getBaseUrl } from '@/utils/url';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'reset';
}

// Create a separate component that uses useSearchParams
function AuthFormWithParams({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
        setError('Your password reset link has expired. Please request a new link.');
      } else if (errorDescription) {
        // Properly decode the URL-encoded error description
        try {
          const decodedError = decodeURIComponent(errorDescription);
          setError(decodedError);
        } catch (e) {
          // Fallback if decoding fails
          setError(errorDescription.replace(/\+/g, ' '));
        }
      } else {
        setError('An error occurred during authentication. Please try again.');
      }
    }
  }, [searchParams]);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          logger.info('User already authenticated', { 
            userId: session.user.id,
            redirectedFrom: redirectedFrom || 'none'
          });
          // If we're on an auth page and have a session, redirect to dashboard
          if (redirectedFrom) {
            router.push(redirectedFrom);
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        logger.error('Initial auth check failed', { 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    checkAuth();
  }, [router, redirectedFrom]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = initializeAuthListener((event, session) => {
      logger.info('Auth state changed', { event, userId: session?.user?.id });
      if (event === 'SIGNED_IN' && session) {
        // Clear any existing error
        setError(null);
        
        // If there's a redirect URL, use it, otherwise go to dashboard
        if (redirectedFrom) {
          router.push(redirectedFrom);
        } else {
          router.push('/dashboard');
        }
      }
    });

    return () => {
      if (unsubscribe) {
        logger.debug('Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, [router, redirectedFrom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      logger.info('Starting auth operation', { mode, email });

      if (mode === 'signup') {
        await withRetry(async () => {
          logger.info('Attempting signup', { email });
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });
          if (error) {
            logger.error('Signup failed', { error: error.message });
            throw new AuthError(
              'Failed to sign up',
              AuthErrorCodes.SIGNUP_ERROR,
              error
            );
          }
          logger.info('Signup successful, verification email sent', { email });
        });
        setMessage('Check your email for the confirmation link.');
      } else if (mode === 'signin') {
        await withRetry(async () => {
          logger.info('Attempting signin', { email });
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            logger.error('Signin failed', { error: error.message });
            // Map Supabase's invalid credentials error to our error code
            if (error.message.includes('Invalid login credentials')) {
              throw new AuthError(
                'Invalid email or password',
                AuthErrorCodes.INVALID_CREDENTIALS,
                error
              );
            }
            throw new AuthError(
              'Failed to sign in',
              AuthErrorCodes.SIGNIN_ERROR,
              error
            );
          }
          logger.info('Signin successful', { email });
        });
      } else if (mode === 'reset') {
        await withRetry(async () => {
          // Use getAppURL to ensure we get the correct URL for the current environment
          const baseUrl = getBaseUrl();
          logger.info('Attempting password reset', { email, baseUrl });
          
          // Enhanced logging for debugging the redirect URL
          const redirectUrl = `${baseUrl}/auth/update-password`;
          logger.info('Reset password redirect details', { 
            baseUrl, 
            redirectUrl,
            nodeEnv: process.env.NODE_ENV,
            isClient: typeof window !== 'undefined',
            vercelUrl: process.env.VERCEL_URL,
            publicVercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL
          });
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/auth/update-password`,
          });
          if (error) {
            logger.error('Password reset failed', { error: error.message });
            throw new AuthError(
              'Failed to send reset password email',
              AuthErrorCodes.RESET_PASSWORD_ERROR,
              error
            );
          }
          logger.info('Password reset email sent', { email });
        });
        setMessage('Check your email for the password reset link.');
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
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create a new account'}
            {mode === 'reset' && 'Reset your password'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {mode === 'signup' && (
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
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
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
              {mode === 'signin' && 'Sign in'}
              {mode === 'signup' && 'Sign up'}
              {mode === 'reset' && 'Send reset link'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          {mode === 'signin' && (
            <>
              <p className="text-sm text-gray-600">
                <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Don't have an account? Sign up
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link href="/auth/reset-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-sm text-gray-600">
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                Already have an account? Sign in
              </Link>
            </p>
          )}
          {mode === 'reset' && (
            <p className="text-sm text-gray-600">
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
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