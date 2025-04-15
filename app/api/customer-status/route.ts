import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndCheckCustomerStatus } from '@/lib/stripe-customer';
import { logger } from '@/lib/logger';

/**
 * API route to check a customer's subscription status
 * POST /api/customer-status
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email } = body;

    // Validate the email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Authenticate the customer and check their subscription status
    const customerStatus = await authenticateAndCheckCustomerStatus(email);

    // Return the customer status
    return NextResponse.json(customerStatus);
  } catch (error) {
    logger.error('Error in customer status API route', { error });
    
    return NextResponse.json(
      { error: 'Failed to check customer status' },
      { status: 500 }
    );
  }
} 