'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { getSession } from '@/utils/auth-state';

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await getSession();
        if (session) {
          // If authenticated, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking session:', error);
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