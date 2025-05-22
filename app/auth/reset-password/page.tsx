'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/utils/supabase';
import { logDebug, logError } from '@/lib/logging';

export default function ResetPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        // If user is already logged in, redirect to dashboard
        if (session) {
          logDebug('User already authenticated, redirecting from reset-password to dashboard', { 
            userId: session.user?.id 
          });
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        logError('Error checking session', error, { page: 'reset-password' });
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <AuthForm mode="reset" />

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Remember your password? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
} 