'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Plan {
  id: string;
  amount: number;
  interval: string;
  description: string;
  features: string[];
}

export default function SubscribePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<{ monthly: Plan; yearly: Plan } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/get-prices');
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async () => {
    if (!plans) return;

    try {
      const priceId = selectedPlan === 'monthly' 
        ? plans.monthly.id 
        : plans.yearly.id;

      // Check for test keys
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (publishableKey?.includes('_test_')) {
        console.warn('⚠️ Using Stripe test keys - This is a test environment');
      }
      
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const { sessionId } = await response.json();
      console.log('Redirecting to Stripe checkout with session:', sessionId);

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error during subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
    }
  };

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

  if (!plans) {
    return (
      <Layout>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-nt-red">Failed to load subscription plans. Please try again later.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-nt-md ${
                  selectedPlan === 'monthly' 
                    ? 'border-2 border-nt-blue bg-nt-blue/5' 
                    : 'border border-nt-gray/20'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-nt-gray">Monthly Plan</CardTitle>
                  <CardDescription className="text-nt-gray/70">{plans.monthly.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4 text-nt-gray">${plans.monthly.amount}</div>
                  <div className="text-nt-gray/70 mb-6">per {plans.monthly.interval}</div>
                  <ul className="space-y-2">
                    {plans.monthly.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-nt-gray">
                        <svg className="w-5 h-5 text-nt-green mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-nt-md ${
                  selectedPlan === 'yearly' 
                    ? 'border-2 border-nt-blue bg-nt-blue/5' 
                    : 'border border-nt-gray/20'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-nt-gray">Yearly Plan</CardTitle>
                  <CardDescription className="text-nt-gray/70">{plans.yearly.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-4 text-nt-gray">${plans.yearly.amount}</div>
                  <div className="text-nt-gray/70 mb-6">per {plans.yearly.interval}</div>
                  <ul className="space-y-2">
                    {plans.yearly.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-nt-gray">
                        <svg className="w-5 h-5 text-nt-green mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleSubscribe} 
                className="bg-nt-blue text-white shadow-nt-sm hover:bg-nt-blue/90 rounded-nt-lg px-8 py-3 text-lg"
              >
                Subscribe Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 