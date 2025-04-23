'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FinancialSimulator from "../../financial-simulator";
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';
import Layout from '@/app/components/Layout';

export default function SimulatorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Error checking authentication:', error);
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
    <Layout>
      <FinancialSimulator />
    </Layout>
  );
}

