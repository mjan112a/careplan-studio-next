'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FinancialSimulator from "../../financial-simulator";
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';
import Layout from '@/app/components/Layout';
import { logDebug, logError } from '@/lib/logging';

export default function SimulatorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          logDebug('User not authenticated, redirecting from simulator to home');
          router.push('/');
          return;
        }
        logDebug('User authenticated for simulator', { userId: session.user.id });
        setUser(session.user);
      } catch (error) {
        logError('Error checking authentication', error, { page: 'simulator' });
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout user={user}>
      <FinancialSimulator />
    </Layout>
  );
}

