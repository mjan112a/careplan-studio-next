'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import './StripePricingTable.css';
import { logger } from '@/lib/logger';
import { getBaseUrl } from '@/utils/url';

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
        'success-url'?: string;
        'client-reference-id'?: string;
        'customer-email'?: string;
      }, HTMLElement>;
    }
  }
}

interface StripePricingTableIsolatedProps {
  userId?: string | null;
  userEmail?: string | null;
}

export default function StripePricingTableIsolated({ 
  userId = null, 
  userEmail = null 
}: StripePricingTableIsolatedProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  
  // Get the publishable key from environment variables
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R8lEzJtL7Msij8lJvt2O1lT9vjEKpLOOiGu7jjLIZKRDrZyZQXhbbIw2Y1JDS72r9ceSy5TpmVvU1w8zSrZpFFz00iZQa6M7D';

  // Get the base URL using the utility function
  const baseUrl = getBaseUrl();
  
  // Construct the success URL with the session ID parameter
  const successUrl = `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;

  // Use type assertion to bypass TypeScript checking for custom elements
  const StripeTable = 'stripe-pricing-table' as any;
  
  useEffect(() => {
    // Log initial state
    logger.debug('Stripe Pricing Table - Initial State', { 
      isScriptLoaded,
      scriptError,
      userId,
      userEmail,
      successUrl,
      publishableKey: publishableKey.substring(0, 10) + '...' // Log only first 10 chars for security
    });

    // Check if the custom element is defined
    if (typeof window !== 'undefined' && !customElements.get('stripe-pricing-table')) {
      logger.warn('Stripe Pricing Table custom element not found');
    }
  }, [isScriptLoaded, scriptError, userId, userEmail, successUrl, publishableKey]);

  return (
    <>
      <Script 
        src="https://js.stripe.com/v3/pricing-table.js" 
        strategy="afterInteractive"
        onLoad={() => {
          logger.debug('Stripe Pricing Table script loaded successfully');
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          const error = 'Failed to load Stripe Pricing Table script';
          logger.error(error, { error: e });
          setScriptError(error);
        }}
      />
      
      {scriptError ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-red-600">
            <p>Error loading subscription plans. Please try refreshing the page.</p>
            <p className="text-sm mt-2">{scriptError}</p>
          </div>
        </div>
      ) : !isScriptLoaded ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nt-blue mx-auto"></div>
            <p className="mt-4 text-nt-gray">Loading subscription plans...</p>
          </div>
        </div>
      ) : (
        <StripeTable 
          pricing-table-id="prctbl_1RCllHJtL7Msij8lkooRsSwC"
          publishable-key={publishableKey}
          success-url={successUrl}
          client-reference-id={userId || undefined}
          customer-email={userEmail || undefined}>
        </StripeTable>
      )}
    </>
  );
} 