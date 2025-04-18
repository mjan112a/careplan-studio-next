'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/utils/auth-state';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          // If authenticated, redirect to dashboard
          router.push('/dashboard');
        } else {
          // If not authenticated, redirect to home page
          router.push('/home');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // On error, redirect to home page
        router.push('/home');
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-center">
        <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
      </div>
    </div>
  );
}

