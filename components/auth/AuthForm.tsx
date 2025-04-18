import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { initializeAuthListener, getSession } from '@/utils/auth-state';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AuthError, AuthErrorCodes } from '@/types/auth-errors';
import { getAuthErrorMessage, logAuthError } from '@/utils/error-messages';
import { withRetry } from '@/utils/retry';

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

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          // If we're on an auth page and have a session, redirect to dashboard
          if (redirectedFrom) {
            router.push(redirectedFrom);
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        // Only log the error, don't show it to the user
        logAuthError(error, 'AuthForm-initial-check');
      }
    };

    checkAuth();
  }, [router, redirectedFrom]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = initializeAuthListener((event, session) => {
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
      if (unsubscribe) unsubscribe();
    };
  }, [router, redirectedFrom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await withRetry(async () => {
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
            throw new AuthError(
              'Failed to sign up',
              AuthErrorCodes.SIGNUP_ERROR,
              error
            );
          }
        });
        setMessage('Check your email for the confirmation link.');
      } else if (mode === 'signin') {
        await withRetry(async () => {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            throw new AuthError(
              'Failed to sign in',
              AuthErrorCodes.SIGNIN_ERROR,
              error
            );
          }
        });
      } else if (mode === 'reset') {
        await withRetry(async () => {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`,
          });
          if (error) {
            throw new AuthError(
              'Failed to send reset password email',
              AuthErrorCodes.RESET_PASSWORD_ERROR,
              error
            );
          }
        });
        setMessage('Check your email for the password reset link.');
      }
    } catch (error) {
      logAuthError(error, 'AuthForm-handleSubmit');
      setError(getAuthErrorMessage(error));
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