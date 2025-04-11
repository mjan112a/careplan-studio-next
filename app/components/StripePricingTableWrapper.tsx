'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';

// Dynamically import the StripePricingTable component with no SSR
const StripePricingTable = dynamic(
  () => import('./StripePricingTable'),
  { ssr: false }
);

export default function StripePricingTableWrapper() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      <StripePricingTable />
      
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