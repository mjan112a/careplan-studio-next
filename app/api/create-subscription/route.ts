import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

    // Get the base URL, with fallback to VERCEL_URL
    let baseUrl: string;
    try {
      logger.debug('Attempting to get URL from request...');
      const requestUrl = new URL(req.url);
      logger.debug('Request URL details:', {
        protocol: requestUrl.protocol,
        host: requestUrl.host,
        fullUrl: requestUrl.toString(),
      });
      baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      logger.debug('Successfully constructed base URL from request:', { baseUrl });
    } catch (error) {
      logger.error('Failed to parse request URL:', { error });
      // Fallback to VERCEL_URL if request URL parsing fails
      const vercelUrl = process.env.VERCEL_URL;
      logger.debug('Attempting to use VERCEL_URL:', { vercelUrl });
      
      if (!vercelUrl) {
        logger.error('VERCEL_URL is not set', { error: 'Missing environment variable' });
        throw new Error('Could not determine base URL - VERCEL_URL is not set');
      }
      baseUrl = `https://${vercelUrl}`;
      logger.debug('Using VERCEL_URL as fallback:', { baseUrl });
    }

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