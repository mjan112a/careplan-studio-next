'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import './StripePricingTable.css';

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
      }, HTMLElement>;
    }
  }
}

export default function StripePricingTable() {
  useEffect(() => {
    // This ensures the script is loaded and the custom element is registered
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Use type assertion to bypass TypeScript checking for custom elements
  const StripeTable = 'stripe-pricing-table' as any;
  
  // Get the publishable key from environment variables
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R8lEzJtL7Msij8lJvt2O1lT9vjEKpLOOiGu7jjLIZKRDrZyZQXhbbIw2Y1JDS72r9ceSy5TpmVvU1w8zSrZpFFz00iZQa6M7D';

  return (
    <StripeTable 
      pricing-table-id="prctbl_1RCllHJtL7Msij8lkooRsSwC"
      publishable-key={publishableKey}>
    </StripeTable>
  );
} 