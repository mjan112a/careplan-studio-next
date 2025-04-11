'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import StripePricingTableWrapper from '../components/StripePricingTableWrapper';

interface Plan {
  id: string;
  amount: number;
  interval: string;
  description: string;
  features: string[];
}

export default function SubscribePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Check for test keys
  useEffect(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey?.includes('_test_')) {
      console.warn('⚠️ Using Stripe test keys - This is a test environment');
    }
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
              <p className="mt-4 text-nt-gray">Loading subscription plans...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-4xl">
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
            <StripePricingTableWrapper />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 