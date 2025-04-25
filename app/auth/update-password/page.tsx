'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { logger } from '@/lib/logging';

export const runtime = 'nodejs';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Check if we have a valid hash parameter in the URL
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get the current session which should be populated by the hash parameter
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error checking session:', { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
        
        // If there's no session, the user didn't arrive via a reset password link
        if (!session) {
          logger.info('No session found when accessing update-password page');
          setMessage({ 
            type: 'error', 
            text: 'Invalid or expired password reset link. Please request a new password reset.' 
          });
          return;
        }

        // Check for password reset type in session
        // Only proceed if this is a password reset session
        const authType = new URL(window.location.href).hash;
        logger.info('Session found in update-password page', { 
          userId: session.user.id,
          authType: authType || 'none',
          hasHashFragment: !!window.location.hash
        });
        
        // If we have a session but no hash fragment (meaning no #access_token etc. in URL)
        // the user might be navigating here directly while already logged in
        if (!window.location.hash) {
          logger.info('User navigated to update-password without reset link hash fragment');
          // Don't set error message yet as they might still want to update password
        }

      } catch (error) {
        logger.error('Error in update password page:', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          context: { page: 'update-password' }
        });
        setMessage({ 
          type: 'error', 
          text: 'An error occurred. Please try requesting a new password reset link.' 
        });
      } finally {
        setPageLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      logger.info('Attempting to update password');
      
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        logger.error('Failed to update password', { 
          error: error.message,
          stack: error.stack,
          context: { action: 'password-update' }
        });
        throw error;
      }

      logger.info('Password updated successfully');
      setMessage({ 
        type: 'success', 
        text: 'Your password has been updated successfully. You will be redirected to the login page.'
      });
      
      // Sign out the user to invalidate the current session
      logger.info('Signing out user after password update');
      await supabase.auth.signOut();
      
      // Redirect to sign in page after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error) {
      logger.error('Error updating password', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: { action: 'password-update-form-submission' }
      });
      setMessage({ 
        type: 'error', 
        text: error instanceof Error 
          ? error.message 
          : 'Failed to update password. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Update your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={message?.type === 'success'}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={message?.type === 'success'}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || message?.type === 'success'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              Update Password
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
} 