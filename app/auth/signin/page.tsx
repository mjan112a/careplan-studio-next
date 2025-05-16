'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { getSession } from '@/utils/auth-state';
import { logDebug, logError } from '@/lib/logging';

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await getSession();
        if (session) {
          // If authenticated, redirect to dashboard
          logDebug('User already authenticated, redirecting to dashboard', { userId: session.user?.id });
          router.push('/dashboard');
        }
      } catch (error) {
        logError('Error checking session', error, { page: 'signin' });
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <AuthForm mode="signin" />
      </div>
    </div>
  );
} 