import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies()
    });

    // Get the user from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Log session information
    logger.info('Invoices API request', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message
    });

    if (sessionError) {
      logger.error('Session error in invoices API', { error: sessionError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session) {
      logger.warn('No session found in invoices API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('user_stripe_history')
      .select('stripe_invoice_id, created_at, amount, currency, hosted_invoice_url, stripe_subscription_id, stripe_customer_id, stripe_payment_intent_id, stripe_charge_id')
      .eq('user_id', session.user.id)
      .eq('stripe_event_type', 'invoice.paid')
      .order('created_at', { ascending: false });

    // Log query results
    logger.info('Invoices query results', {
      userId: session.user.id,
      invoiceCount: invoices?.length || 0,
      hasError: !!invoicesError,
      error: invoicesError?.message
    });

    if (invoicesError) {
      logger.error('Error fetching invoices', { error: invoicesError });
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Transform the data
    const transformedInvoices = (invoices || []).map(invoice => ({
      invoice_id: invoice.stripe_invoice_id,
      invoice_date: invoice.created_at,
      amount: invoice.amount,
      currency: invoice.currency,
      hosted_invoice_url: invoice.hosted_invoice_url,
      subscription_id: invoice.stripe_subscription_id,
      customer_id: invoice.stripe_customer_id,
      payment_intent_id: invoice.stripe_payment_intent_id,
      charge_id: invoice.stripe_charge_id
    }));

    return NextResponse.json({ invoices: transformedInvoices });
  } catch (error) {
    logger.error('Error in invoices API', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 