import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
    const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

    if (!monthlyPriceId || !yearlyPriceId) {
      throw new Error('Price IDs are not configured');
    }

    const [monthlyPrice, yearlyPrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId),
      stripe.prices.retrieve(yearlyPriceId),
    ]);

    logger.debug('Retrieved prices from Stripe:', {
      monthlyPrice: monthlyPrice.id,
      yearlyPrice: yearlyPrice.id,
    });

    return NextResponse.json({
      monthly: {
        id: monthlyPrice.id,
        amount: monthlyPrice.unit_amount! / 100, // Convert from cents to dollars
        interval: monthlyPrice.recurring?.interval,
        description: 'Perfect for individuals and small teams',
        features: [
          'Unlimited sales listings',
          'Advanced search filters',
          'Email notifications',
          'Basic analytics'
        ]
      },
      yearly: {
        id: yearlyPrice.id,
        amount: yearlyPrice.unit_amount! / 100, // Convert from cents to dollars
        interval: yearlyPrice.recurring?.interval,
        description: 'Best value with 2 months free',
        features: [
          'Everything in Monthly plan',
          'Priority support',
          'Custom branding',
          'Advanced analytics',
          'Bulk listing tools'
        ]
      }
    });
  } catch (error) {
    logger.error('Error fetching prices:', { error });
    return NextResponse.json(
      { error: 'Error fetching prices' },
      { status: 500 }
    );
  }
} 