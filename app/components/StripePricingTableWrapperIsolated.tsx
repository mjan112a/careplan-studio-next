'use client';

import { useEffect, useState, memo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logging';

// Use memo to prevent unnecessary re-renders of the dynamic component
const StripePricingTableIsolated = memo(dynamic(
  () => import('./StripePricingTableIsolated'),
  { 
    ssr: false,
    loading: () => null // Use the suspense fallback instead
  }
));

interface StripePricingTableWrapperIsolatedProps {
  userId?: string | null;
  userEmail?: string | null;
}

export default function StripePricingTableWrapperIsolated({ 
  userId = null, 
  userEmail = null 
}: StripePricingTableWrapperIsolatedProps) {
  const router = useRouter();
  const isAuthenticated = Boolean(userId);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only log once per component mount
    if (!isInitialized) {
      if (userId) {
        logger.info('Initializing Stripe pricing table for authenticated user', { userId });
      } else {
        logger.info('Initializing Stripe pricing table for unauthenticated user');
      }
      setIsInitialized(true);
    }
  }, [userId, isInitialized]);

  const handleSignUp = () => {
    router.push('/auth/signup?redirectedFrom=/subscribe');
  };

  return (
    <div className="space-y-8">
      <div className="relative">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
              <p className="mt-4 text-nt-gray">Loading subscription plans...WW</p>
            </div>
          </div>
        }>
          <StripePricingTableIsolated 
            userId={userId} 
            userEmail={userEmail} 
          />
        </Suspense>
        
        {!isAuthenticated && (
          <div className="absolute inset-0 bg-transparent z-10" onClick={handleSignUp}></div>
        )}
      </div>
      
      {!isAuthenticated && (
        <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-2">Sign up to Subscribe</h3>
          <p className="text-gray-600 mb-4">
            Create an Account to start your subscription
          </p>
          <Button 
            onClick={handleSignUp}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign Up Now
          </Button>
        </div>
      )}
    </div>
  );
} 