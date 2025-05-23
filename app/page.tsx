'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { logger } from '@/lib/logging';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    logger.debug('Root page redirecting to home');
    router.replace(ROUTES.HOME_PAGE);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-center">
        <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
      </div>
    </div>
  );
}

