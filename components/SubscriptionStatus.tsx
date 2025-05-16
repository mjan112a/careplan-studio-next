'use client';

import { useState, useEffect } from 'react';
import { CustomerSubscriptionStatus } from '@/lib/stripe';
import { fetchCustomerStatus, isInTrialPeriod, getExpirationDate } from '@/lib/customer-status';
import { logDebug, logError } from '@/lib/logging';

interface SubscriptionStatusProps {
  email: string;
}

/**
 * A component that displays a user's subscription status
 */
export default function SubscriptionStatus({ email }: SubscriptionStatusProps) {
  const [status, setStatus] = useState<CustomerSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerStatus() {
      try {
        setLoading(true);
        logDebug('Loading customer subscription status', { email });
        const customerStatus = await fetchCustomerStatus(email);
        setStatus(customerStatus);
        setError(null);
        logDebug('Customer subscription status loaded', { 
          email, 
          hasActiveSubscription: customerStatus.hasActiveSubscription,
          isInTrial: customerStatus.isInTrial,
          productCount: Object.keys(customerStatus.products || {}).length
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription status';
        setError(errorMessage);
        logError('Error loading subscription status', err, { email });
      } finally {
        setLoading(false);
      }
    }

    if (email) {
      loadCustomerStatus();
    }
  }, [email]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const inTrial = isInTrialPeriod(status);
  const expirationDate = getExpirationDate(status);
  const hasActiveSubscription = status.hasActiveSubscription;
  const products = Object.values(status.products);

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            hasActiveSubscription ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm font-medium">
            {hasActiveSubscription ? 'Active Subscription' : 'No Active Subscription'}
          </span>
        </div>
        
        {inTrial && expirationDate && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div>
            <span className="text-sm font-medium">
              Trial Period - Ends {expirationDate.toLocaleDateString()}
            </span>
          </div>
        )}
        
        {products.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Subscribed Products</h4>
            <ul className="space-y-2">
              {products.map((product) => (
                <li key={product.name} className="text-sm">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      product.active ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span>{product.name}</span>
                  </div>
                  {product.subscriptionEndsAt && (
                    <div className="ml-4 text-xs text-gray-500">
                      Renews on {new Date(product.subscriptionEndsAt * 1000).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!hasActiveSubscription && products.length === 0 && (
          <div className="text-sm text-gray-500">
            You don't have any active subscriptions. 
            <a href="/pricing" className="text-blue-600 hover:text-blue-800 ml-1">
              View our plans
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 