'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

// Dynamically import the StripePricingTableIsolated component with no SSR
const StripePricingTableIsolated = dynamic(
  () => import('./StripePricingTableIsolated'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
          <p className="mt-4 text-nt-gray">Loading subscription plans...</p>
        </div>
      </div>
    )
  }
);

interface StripePricingTableWrapperIsolatedProps {
  userId?: string | null;
  userEmail?: string | null;
}

export default function StripePricingTableWrapperIsolated({ 
  userId = null, 
  userEmail = null 
}: StripePricingTableWrapperIsolatedProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserId, setLocalUserId] = useState<string | null>(userId);
  const [localUserEmail, setLocalUserEmail] = useState<string | null>(userEmail);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Reset loading state when starting a new check
        if (isMounted) {
          setIsLoading(true);
        }
        
        // If userId and userEmail are provided as props, use them
        if (userId && userEmail) {
          if (isMounted) {
            setLocalUserId(userId);
            setLocalUserEmail(userEmail);
            setIsAuthenticated(true);
            setIsLoading(false);
            setAuthChecked(true);
          }
          return;
        }
        
        // Otherwise, fetch from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user) {
            setLocalUserId(session.user.id);
            setLocalUserEmail(session.user.email || null);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
          setIsLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        logger.error('Error checking authentication', { error });
        if (isMounted) {
          setIsLoading(false);
          setAuthChecked(true);
        }
      }
    };

    checkAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [userId, userEmail, authChecked]);

  const handleSignUp = () => {
    router.push('/auth/signup?redirectedFrom=/subscribe');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
          <p className="mt-4 text-nt-gray">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
            <p className="mt-4 text-nt-gray">Loading subscription plans...</p>
          </div>
        </div>
      }>
        <StripePricingTableIsolated 
          userId={localUserId} 
          userEmail={localUserEmail} 
        />
      </Suspense>
      
      {!isAuthenticated && (
        <>
          {/* Invisible overlay to prevent interaction with the pricing table */}
          <div className="absolute inset-0 bg-transparent z-10" onClick={handleSignUp}></div>
          
          {/* Sign up prompt */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            <div className="bg-white/90 p-6 rounded-lg shadow-lg text-center max-w-md pointer-events-auto">
              <h3 className="text-xl font-bold mb-2">Sign up to view subscription plans</h3>
              <p className="text-gray-600 mb-4">
                Create an account to see our subscription options and save your preferences.
              </p>
              <Button 
                onClick={handleSignUp}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign Up Now
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 