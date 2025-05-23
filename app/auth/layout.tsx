'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logging';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  logger.debug('Rendering auth layout');
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ErrorBoundary>
  );
} 