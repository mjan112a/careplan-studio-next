import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Testing Stripe API connection via API route');
    
    // Make a simple API call that should trigger the event listeners
    const balance = await stripe.balance.retrieve();
    
    logger.info('Test API call successful', { balance });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe API test successful',
      balance: balance
    });
  } catch (error) {
    logger.error('Test API call failed', { error });
    
    return NextResponse.json({ 
      success: false, 
      message: 'Stripe API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 