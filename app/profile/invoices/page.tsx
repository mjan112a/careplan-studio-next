'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/utils/supabase';
import { format } from 'date-fns';
import Link from 'next/link';

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        // Fetch invoices using the stored procedure
        const { data, error } = await supabase
          .rpc('get_user_invoices', { p_user_id: user.id });

        if (error) throw error;
        
        setInvoices(data || []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                {invoices.map((invoice) => (
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
                      }).format(invoice.amount)}
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
      </div>
    </Layout>
  );
} 