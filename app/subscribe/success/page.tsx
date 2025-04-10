'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';

export default function SubscribeSuccessPage() {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, you would verify the session with your backend
    // and fetch the actual subscription plan details
    setPlan('Premium'); // Placeholder
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Subscription Success</h1>
        
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Welcome to {plan}!
            </CardTitle>
            <CardDescription className="text-center text-lg text-gray-600 mt-2">
              Your subscription has been successfully activated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-center text-gray-700 leading-relaxed">
                  Thank you for subscribing to our platform. You now have access to all premium features,
                  including ad-free browsing, advanced search filters, and priority support.
                </p>
                <p className="text-center text-gray-700 leading-relaxed mt-4">
                  Your subscription will automatically renew, but you can manage your subscription settings
                  at any time from your account home page.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl px-4">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="border-2 hover:bg-blue-50">
                <Link href="/home">Go to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 