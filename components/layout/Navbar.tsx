'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logging';
import { ROUTES } from '@/lib/constants/routes';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      logger.info('User signed out');
      
      // Clear any local storage items
      localStorage.clear();
      
      // Clear any session storage items
      sessionStorage.clear();
      
      // Force a hard navigation to clear server-side state and all cookies
      window.location.href = ROUTES.AUTH.SIGN_IN;
    } catch (error) {
      logger.error('Error signing out:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href={ROUTES.DASHBOARD} className="text-xl font-bold text-indigo-600">
              CarePlan Studio
            </Link>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="relative ml-3">
                <button
                  type="button"
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-800 font-medium text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
                
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      {user.email}
                    </div>
                    <Link
                      href={ROUTES.PROFILE}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href={ROUTES.PROFILE_ROUTES.INVOICES}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Your Invoices
                    </Link>
                    <Link
                      href={ROUTES.SUBSCRIBE}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={ROUTES.AUTH.SIGN_IN} className="text-sm font-medium text-gray-700 hover:text-gray-800">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 