import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import Layout from '@/app/components/Layout';
import { format } from 'date-fns';
import Link from 'next/link';
import { logger } from '@/lib/logging';
import { headers } from 'next/headers';
import { getBaseUrl } from '@/utils/url';

export const runtime = 'nodejs';

interface Invoice {
  invoice_id: string;
  invoice_date: string;
  amount: number;
  currency: string;
  hosted_invoice_url: string;
  subscription_id: string;
  customer_id: string;
  payment_intent_id: string;
  charge_id: string;
}

async function InvoicesContent() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    // Get the base URL and auth cookie from the headers
    const headersList = await headers();
    const baseUrl = await getBaseUrl(headersList);

    const response = await fetch(`${baseUrl}/api/invoices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: headersList.get('cookie') || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    const data = await response.json();
    const invoices = data.invoices || [];

    logger.info('Fetched invoices', { count: invoices.length });

    return (
      <>
        {invoices.length === 0 ? (
          <div className="bg-gray-100 p-6 rounded-lg text-center">
            <p className="text-gray-600">You don't have any invoices yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Invoice ID</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Subscription</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: Invoice) => (
                  <tr key={invoice.invoice_id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{invoice.invoice_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: invoice.currency || 'USD',
                      }).format(invoice.amount / 100)} {/* Amount is in cents */}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">{invoice.subscription_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      {invoice.hosted_invoice_url && (
                        <a 
                          href={invoice.hosted_invoice_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Invoice
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  } catch (error) {
    logger.error('Error fetching invoices', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
        <p className="font-bold">Error</p>
        <p>Failed to load invoices. Please try again later.</p>
      </div>
    );
  }
}

export default async function InvoicesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Invoices</h1>
          <Link 
            href="/profile" 
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Profile
          </Link>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          <InvoicesContent />
        </Suspense>
      </div>
    </Layout>
  );
} 