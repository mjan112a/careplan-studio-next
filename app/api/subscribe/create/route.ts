import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logging';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getBaseUrl } from '@/utils/url';
import { headers } from 'next/headers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();
    logger.debug('Received subscription request', { priceId });

    // Check for test keys
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey?.includes('_test_')) {
      logger.warn('Using Stripe test secret key', { environment: 'test' });
    }

    // Log environment variables for debugging
    logger.debug('Environment variables:', {
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });

    // Get the base URL using the utility function
    const headersList = headers();
    const baseUrl = await getBaseUrl(headersList);
    logger.debug('Base URL determined:', { baseUrl });

    // Log the final URLs being used
    const successUrl = `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscribe`;
    logger.debug('Final URLs:', {
      successUrl,
      cancelUrl,
    });

    // Get the user ID from the session
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const userId = authSession?.user?.id;
    
    logger.debug('User session:', {
      userId: userId || 'Not authenticated',
      isAuthenticated: !!userId
    });

    // Create the checkout session
    const sessionParams = {
      payment_method_types: ['card' as const],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription' as const,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId || undefined,
    };
    
    logger.debug('Creating Stripe checkout session with params:', sessionParams);
    
    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    logger.debug('Created Stripe checkout session', { 
      sessionId: checkoutSession.id,
      clientReferenceId: checkoutSession.client_reference_id,
      customerId: checkoutSession.customer,
      subscriptionId: checkoutSession.subscription
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    logger.error('Error creating subscription', { error });
    return NextResponse.json(
      { error: 'Error creating subscription' },
      { status: 500 }
    );
  }
} 