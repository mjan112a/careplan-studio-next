import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/supabase';

export const runtime = 'nodejs';

type InvoiceData = {
  stripe_invoice_id: string | null;
  created_at: string;
  amount: number | null;
  currency: string | null;
  hosted_invoice_url: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get user ID from authenticated session (middleware ensures this exists)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      logger.error('No user found in authenticated session');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Fetch invoices using the user's ID string
    const { data: invoices, error: invoicesError } = await supabase
      .from('user_stripe_history')
      .select('stripe_invoice_id, created_at, amount, currency, hosted_invoice_url, stripe_subscription_id, stripe_customer_id, stripe_payment_intent_id, stripe_charge_id')
      .eq('user_id', user.id)
      .eq('stripe_event_type', 'invoice.paid')
      .order('created_at', { ascending: false });

    // Log query results
    logger.debug('Invoices query results', {
      userId: user.id,
      invoiceCount: invoices?.length || 0,
      hasError: !!invoicesError,
      error: invoicesError?.message
    });

    if (invoicesError) {
      logger.error('Error fetching invoices', { 
        error: invoicesError,
        userId: user.id,
        context: {
          message: invoicesError.message,
          code: invoicesError.code,
          details: invoicesError.details
        }
      });
      return NextResponse.json(
        { error: 'Failed to fetch invoices' }, 
        { status: 500 }
      );
    }

    // Transform the data
    const transformedInvoices = (invoices || []).map((invoice: InvoiceData) => ({
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
    logger.error('Error in invoices API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 