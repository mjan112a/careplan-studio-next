import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from '@/lib/supabase/client';
import Layout from '@/app/components/Layout';
import { logger } from '@/lib/logging';
import StripePricingTableWrapperIsolated from '../components/StripePricingTableWrapperIsolated';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function SubscribeContent() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      logger.error('No user found in authenticated session');
      return <div>Error: Not authenticated</div>;
    }

    // Check for test keys
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey?.includes('_test_')) {
      logger.warn('Using Stripe test keys', { environment: 'test' });
    }

    return (
      <div className="container mx-auto px-4 max-w-4xl">
        {publishableKey?.includes('_test_') && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">⚠️ Test Environment</p>
            <p className="text-yellow-700 text-sm">Using Stripe test keys - No real charges will be made</p>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-8">Subscription Plans</h1>
        
        <Card className="border-0 shadow-nt-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-center text-nt-gray">
              Choose Your Perfect Plan
            </CardTitle>
            <CardDescription className="text-center text-lg text-nt-gray/70">
              Select the plan that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <StripePricingTableWrapperIsolated 
              userId={user.id} 
              userEmail={user.email || null} 
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    logger.error('Error in subscribe page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return (
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading subscription plans
        </div>
      </div>
    );
  }
}

export default async function SubscribePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Layout user={user}>
      <Suspense fallback={
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
              <p className="mt-4 text-nt-gray">Loading...</p>
            </div>
          </div>
        </div>
      }>
        <SubscribeContent />
      </Suspense>
    </Layout>
  );
} 