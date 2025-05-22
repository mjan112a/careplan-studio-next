'use client';

import { useState, useEffect } from 'react';
import { CustomerSubscriptionStatus } from '@/lib/stripe';
import { fetchCustomerStatus, hasProductAccess, isInTrialPeriod, getExpirationDate } from '@/lib/customer-status';
import { logger, logError } from '@/lib/logging';

interface CustomerStatusProps {
  email: string;
  productId?: string;
  children: React.ReactNode;
}

/**
 * A component that checks a customer's subscription status and conditionally renders children
 * based on whether the customer has access to a product.
 */
export default function CustomerStatus({ email, productId, children }: CustomerStatusProps) {
  const [status, setStatus] = useState<CustomerSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerStatus() {
      try {
        setLoading(true);
        logger.debug('Loading customer subscription status', { email, productId });
        const customerStatus = await fetchCustomerStatus(email);
        setStatus(customerStatus);
        setError(null);
        logger.debug('Customer subscription status loaded', { 
          email, 
          hasActiveSubscription: customerStatus.hasActiveSubscription,
          isInTrial: customerStatus.isInTrial
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load customer status';
        setError(errorMessage);
        logError('Error loading customer status', err, { email, productId });
      } finally {
        setLoading(false);
      }
    }

    if (email) {
      loadCustomerStatus();
    }
  }, [email, productId]);

  // If loading, show a loading state
  if (loading) {
    return <div>Loading subscription status...</div>;
  }

  // If there's an error, show the error
  if (error) {
    return <div>Error: {error}</div>;
  }

  // If no status, show nothing
  if (!status) {
    return null;
  }

  // If a product ID is provided, check if the customer has access to that product
  if (productId) {
    const hasAccess = hasProductAccess(status, productId);
    if (!hasAccess) {
      logger.info('Customer lacks access to product', { email, productId });
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-yellow-800 font-medium">Subscription Required</h3>
          <p className="text-yellow-700">
            You need an active subscription to access this content.
          </p>
        </div>
      );
    }
  }

  // If the customer is in a trial period, show a trial banner
  const inTrial = isInTrialPeriod(status);
  const expirationDate = getExpirationDate(status, productId);
  
  return (
    <>
      {inTrial && expirationDate && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
          <h3 className="text-blue-800 font-medium">Trial Period</h3>
          <p className="text-blue-700">
            Your trial ends on {expirationDate.toLocaleDateString()}.
          </p>
        </div>
      )}
      
      {children}
    </>
  );
} 