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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If userId and userEmail are provided as props, use them
        if (userId && userEmail) {
          setLocalUserId(userId);
          setLocalUserEmail(userEmail);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // Otherwise, fetch from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setLocalUserId(session.user.id);
          setLocalUserEmail(session.user.email || null);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error('Error checking authentication', { error });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [userId, userEmail]);

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
        <div 
          className="absolute inset-0 bg-white/20 flex flex-col items-center z-10 cursor-pointer" 
          onClick={handleSignUp}
        >
          <div className="w-full flex justify-center -mt-12">
            <Button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent double triggering
                handleSignUp();
              }} 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign Up to Subscribe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 